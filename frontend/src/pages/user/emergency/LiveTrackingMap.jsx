import React from "react";
import MapContainer from "../../../components/maps/MapContainer";
import UserMarker from "../../../components/maps/UserMarker";
import AmbulanceMarker from "../../../components/maps/AmbulanceMarker";
import HospitalMarker from "../../../components/maps/HospitalMarker";
import RoutePolyline from "../../../components/maps/RoutePolyline";

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

  let routePositions = [];
  let routeColor = "#06B6D4"; // Cyan for Phase 1 (Ambulance -> User)
  let activeDistanceKm = 0;
  let computedEtaMins = etaMinutes;
  let statusTitle = "";
  let statusSub = "";

  if (isEnRouteToHospital) {
    // PHASE 2: Destination is the HOSPITAL
    const startPoint = ambulanceLoc || userLoc;
    if (startPoint && hospitalLoc) {
      routePositions = [startPoint, hospitalLoc];
      activeDistanceKm = calcHaversineKm(startPoint[0], startPoint[1], hospitalLoc[0], hospitalLoc[1]);
      computedEtaMins = Math.max(1, Math.round((activeDistanceKm / 40) * 60));
    }
    routeColor = status === "ARRIVED" ? "#F59E0B" : "#10B981"; // Amber at scene, Emerald to Hospital

    if (status === "ARRIVED") {
      statusTitle = "🚑 PARAMEDIC ARRIVED AT SCENE";
      statusSub = `Awaiting arrival OTP. Next destination: ${hospitalName} (${activeDistanceKm} km)`;
    } else if (status === "RESOLVED" || status === "COMPLETED") {
      statusTitle = "✅ PATIENT SAFELY ADMITTED";
      statusSub = `Trip completed at ${hospitalName}`;
    } else {
      statusTitle = `🏥 EN ROUTE TO ${hospitalName.toUpperCase()}`;
      statusSub = `Distance: ${activeDistanceKm} km • Est. Transit: ${computedEtaMins} mins`;
    }
  } else {
    // PHASE 1: Destination is the USER (Accident Scene)
    if (ambulanceLoc && userLoc) {
      routePositions = [ambulanceLoc, userLoc];
      activeDistanceKm = calcHaversineKm(ambulanceLoc[0], ambulanceLoc[1], userLoc[0], userLoc[1]);
      computedEtaMins = Math.max(1, Math.round((activeDistanceKm / 40) * 60));
    }
    routeColor = "#06B6D4";
    statusTitle = `🚑 ${plateNumber} DISPATCHED TO YOUR LOCATION`;
    statusSub = `Live Distance: ${activeDistanceKm} km • Est. Arrival: ${computedEtaMins} mins`;
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
        bounds={allMapPoints.length > 1 ? allMapPoints : null}
      >
        {/* 1. Accident Scene Marker */}
        {userLoc && (
          <UserMarker
            position={userLoc}
            label="Accident Scene (Your Location)"
          />
        )}

        {/* 2. Ambulance Marker */}
        {ambulanceLoc && (
          <AmbulanceMarker
            position={ambulanceLoc}
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
