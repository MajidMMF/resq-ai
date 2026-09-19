import React, { useState, useEffect } from "react";
import MapContainer from "../../../components/maps/MapContainer";
import UserMarker from "../../../components/maps/UserMarker";
import AmbulanceMarker from "../../../components/maps/AmbulanceMarker";
import HospitalMarker from "../../../components/maps/HospitalMarker";
import RoutePolyline from "../../../components/maps/RoutePolyline";
import { fetchRoadRoute, calculateRouteDistanceKm } from "../../../utils/roadRouting";

function calcHaversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const LiveTrackingMap = ({
  userLoc,
  ambulanceLoc,
  hospitalLoc,
  status = "AMBULANCE_ACCEPTED",
  plateNumber = "AMB-104",
  hospitalName = "Emergency Trauma Center",
  etaMinutes = 4,
}) => {
  // Determine if trip has reached Scene/Hospital phase
  const isEnRouteToHospital = [
    "ARRIVED",
    "OTP_VERIFIED",
    "IN_TRANSIT",
    "HOSPITAL_ACCEPTED",
    "HOSPITAL_READY",
    "RESOLVED",
    "COMPLETED",
  ].includes(status);

  const [roadWaypoints, setRoadWaypoints] = useState([]);
  const [animatedAmbPos, setAnimatedAmbPos] = useState(null);

  // 1. Fetch real road-by-road turn coordinates from OSRM
  useEffect(() => {
    let isMounted = true;
    const start = isEnRouteToHospital ? (userLoc || ambulanceLoc) : ambulanceLoc;
    const end = isEnRouteToHospital ? hospitalLoc : userLoc;

    if (start && end) {
      fetchRoadRoute(start, end).then((pts) => {
        if (isMounted && pts && pts.length > 0) {
          setRoadWaypoints(pts);
          setAnimatedAmbPos(pts[0]);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [userLoc, ambulanceLoc, hospitalLoc, isEnRouteToHospital]);

  // 2. Smoothly progress the ambulance icon along real street waypoints
  useEffect(() => {
    if (!roadWaypoints || roadWaypoints.length < 2) return;
    if (status === "ARRIVED" || status === "RESOLVED" || status === "COMPLETED") {
      setAnimatedAmbPos(isEnRouteToHospital ? (hospitalLoc || roadWaypoints[roadWaypoints.length - 1]) : userLoc);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < roadWaypoints.length) {
        setAnimatedAmbPos(roadWaypoints[step]);
      } else {
        // Reached destination for current phase
        clearInterval(interval);
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [roadWaypoints, status, isEnRouteToHospital, userLoc, hospitalLoc]);

  const currentDisplayAmbPos = animatedAmbPos || ambulanceLoc;

  let routePositions = roadWaypoints.length >= 2 ? roadWaypoints : [];
  let routeColor = "#06B6D4"; // Cyan for Phase 1 (Ambulance -> User)
  let activeDistanceKm = 0;
  let computedEtaMins = etaMinutes;
  let statusTitle = "";
  let statusSub = "";

  if (isEnRouteToHospital) {
    // PHASE 2: Destination is the HOSPITAL
    const startPoint = currentDisplayAmbPos || userLoc;
    if (roadWaypoints.length >= 2) {
      activeDistanceKm = calculateRouteDistanceKm(roadWaypoints);
      computedEtaMins = Math.max(1, Math.round((activeDistanceKm / 42) * 60));
    } else if (startPoint && hospitalLoc) {
      routePositions = [startPoint, hospitalLoc];
      activeDistanceKm = calcHaversineKm(startPoint[0], startPoint[1], hospitalLoc[0], hospitalLoc[1]);
      computedEtaMins = Math.max(1, Math.round((activeDistanceKm / 40) * 60));
    }
    routeColor = status === "ARRIVED" ? "#F59E0B" : "#10B981"; // Amber at scene, Emerald to Hospital

    if (status === "ARRIVED") {
      statusTitle = "🚑 PARAMEDIC ARRIVED AT SCENE";
      statusSub = `Awaiting arrival OTP. Next destination: ${hospitalName} (${activeDistanceKm} km via road)`;
    } else if (status === "RESOLVED" || status === "COMPLETED") {
      statusTitle = "✅ PATIENT SAFELY ADMITTED";
      statusSub = `Trip completed at ${hospitalName}`;
    } else {
      statusTitle = `🏥 EN ROUTE TO ${hospitalName.toUpperCase()}`;
      statusSub = `Road Distance: ${activeDistanceKm} km • Est. Transit: ${computedEtaMins} mins`;
    }
  } else {
    // PHASE 1: Destination is the USER (Accident Scene)
    if (roadWaypoints.length >= 2) {
      activeDistanceKm = calculateRouteDistanceKm(roadWaypoints);
      computedEtaMins = Math.max(1, Math.round((activeDistanceKm / 45) * 60));
    } else if (currentDisplayAmbPos && userLoc) {
      routePositions = [currentDisplayAmbPos, userLoc];
      activeDistanceKm = calcHaversineKm(currentDisplayAmbPos[0], currentDisplayAmbPos[1], userLoc[0], userLoc[1]);
      computedEtaMins = Math.max(1, Math.round((activeDistanceKm / 40) * 60));
    }
    routeColor = "#06B6D4";
    statusTitle = `🚑 ${plateNumber} DISPATCHED TO YOUR LOCATION`;
    statusSub = `Road Distance: ${activeDistanceKm} km • Est. Arrival: ${computedEtaMins} mins`;
  }

  // Calculate bounding box for smooth map fitting
  const allMapPoints = [];
  if (userLoc) allMapPoints.push(userLoc);
  if (ambulanceLoc) allMapPoints.push(ambulanceLoc);
  if (isEnRouteToHospital && hospitalLoc) allMapPoints.push(hospitalLoc);

  return (
    <div className="relative w-full h-80 sm:h-[420px] rounded-3xl overflow-hidden border-2 border-dark-700 shadow-2xl">
      {/* Dynamic Navigation HUD Card */}
      <div className="absolute top-4 left-4 z-[400] max-w-sm px-4 py-2.5 rounded-2xl bg-dark-950/95 backdrop-blur-md border border-dark-700/80 shadow-2xl flex items-center space-x-3">
        <span
          className={`w-3 h-3 rounded-full shrink-0 ${
            isEnRouteToHospital ? "bg-emerald-400" : "bg-cyan-400"
          } animate-ping`}
        />
        <div className="overflow-hidden">
          <p className="text-xs font-black text-white font-mono uppercase tracking-wider truncate">
            {statusTitle}
          </p>
          <p className="text-[11px] font-mono font-medium text-dark-300 truncate">
            {statusSub}
          </p>
        </div>
      </div>

      {/* Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[400] px-3 py-1.5 rounded-xl bg-dark-950/90 backdrop-blur-md border border-dark-800 text-[10px] font-mono text-dark-300 hidden sm:flex items-center space-x-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emergency-500" />
          <span>Accident Scene</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Ambulance</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Hospital ER</span>
        </span>
      </div>

      <MapContainer
        center={userLoc || [17.385, 78.4867]}
        zoom={14}
        bounds={roadWaypoints.length > 1 ? roadWaypoints : (allMapPoints.length > 1 ? allMapPoints : null)}
      >
        {/* 1. Accident Scene Marker */}
        {userLoc && (
          <UserMarker
            position={userLoc}
            label="Accident Scene (Your Location)"
          />
        )}

        {/* 2. Ambulance Marker */}
        {currentDisplayAmbPos && (
          <AmbulanceMarker
            position={currentDisplayAmbPos}
            plateNumber={plateNumber}
            eta={isEnRouteToHospital ? `To ER: ${computedEtaMins}m` : `ETA: ${computedEtaMins}m`}
          />
        )}

        {/* 3. Destination Hospital Marker */}
        {hospitalLoc && (
          <HospitalMarker
            position={hospitalLoc}
            name={hospitalName}
          />
        )}

        {/* 4. Active Navigation Polyline (Ambulance -> User OR Scene -> Hospital) */}
        {routePositions.length >= 2 && (
          <RoutePolyline
            positions={routePositions}
            color={routeColor}
            weight={5}
            opacity={0.9}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
