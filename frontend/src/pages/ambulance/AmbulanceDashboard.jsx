import React, { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  useGetMyAssignmentsQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
} from "../../features/ambulances/ambulancesApi";
import { useGetAvailableHospitalsQuery } from "../../features/hospitals/hospitalsApi";
import { useGetActiveIncidentsQuery } from "../../features/incidents/incidentsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import MapContainer from "../../components/maps/MapContainer";
import AmbulanceMarker from "../../components/maps/AmbulanceMarker";
import HospitalMarker from "../../components/maps/HospitalMarker";
import UserMarker from "../../components/maps/UserMarker";
import RoutePolyline from "../../components/maps/RoutePolyline";
import { fetchRoadRoute, calculateRouteDistanceKm } from "../../utils/roadRouting";
import useSocket from "../../hooks/useSocket";
import { playPrettyChime, playEmergencyAlertSiren } from "../../utils/notificationSound";
import {
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Navigation,
  ArrowRight,
  Truck,
  ShieldAlert,
  Compass,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

// Haversine distance calculator in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
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
  return (R * c).toFixed(1);
};

export const AmbulanceDashboard = () => {
  const navigate = useNavigate();

  // Poll for assignments
  const { data: assignmentsData, isLoading, refetch } = useGetMyAssignmentsQuery(undefined, {
    pollingInterval: 3500,
  });

  const assignments = assignmentsData?.data || assignmentsData || [];

  // Driver's live GPS position
  const [driverPos, setDriverPos] = useState([17.4773742, 78.5723865]); // Real Hyderabad default

  // Fetch all registered hospitals around the ambulance
  const { data: hospitalsData } = useGetAvailableHospitalsQuery(
    { lat: driverPos[0], lng: driverPos[1], radius: 50000 },
    { pollingInterval: 15000 }
  );
  const hospitals = Array.isArray(hospitalsData?.data)
    ? hospitalsData.data
    : Array.isArray(hospitalsData)
    ? hospitalsData
    : [];

  // Fetch all active incidents across the city
  const { data: activeIncidentsData } = useGetActiveIncidentsQuery(undefined, {
    pollingInterval: 3500,
  });
  const apiActiveIncidents = Array.isArray(activeIncidentsData?.data)
    ? activeIncidentsData.data
    : Array.isArray(activeIncidentsData)
    ? activeIncidentsData
    : [];

  // Active or incoming assignment
  const pendingRequest = assignments.find((a) => a.status === "REQUESTED");
  const currentRun = assignments.find((a) =>
    ["ACCEPTED", "EN_ROUTE", "ARRIVED", "OTP_VERIFIED"].includes(a.status)
  );

  const [acceptAssignment, { isLoading: isAccepting }] = useAcceptAssignmentMutation();
  const [rejectAssignment, { isLoading: isRejecting }] = useRejectAssignmentMutation();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true }
      );
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Real-time socket listener for incoming emergencies & dispatches
  const outletCtx = useOutletContext() || {};
  const ambulanceId = outletCtx?.ambulance?._id || outletCtx?.ambulance?.id;
  const { socket, on, off, emit } = useSocket();
  const [liveIncidents, setLiveIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Join regional and personal unit rooms for instant callouts
    emit("room:join", { room: "ambulances" });
    emit("room:join", { room: "role:ambulance" });
    if (ambulanceId) {
      emit("room:join", { room: `ambulance:${ambulanceId}` });
    }

    const handleNewEmergency = (data) => {
      console.log("🚨 [AmbulanceDashboard] Emergency callout received:", data);

      // Play authoritative EMS dispatcher siren tone
      playEmergencyAlertSiren();

      const inc = data?.incident || data;
      toast.error("🚨 EMERGENCY CALLOUT ASSIGNED TO YOUR UNIT!", {
        description: inc?.location?.address
          ? `${inc.type || "Trauma"}: ${inc.location.address.split(",").slice(0, 3).join(",")}`
          : "Immediate response requested. Route locked on your live HUD.",
        duration: 12000,
      });

      if (inc && inc._id) {
        setLiveIncidents((prev) => {
          if (prev.some((p) => p._id === inc._id)) return prev;
          return [inc, ...prev];
        });
        setSelectedIncident(inc);
      }
      refetch();
    };

    on("ambulance:requested", handleNewEmergency);
    on("ambulance:assignment", handleNewEmergency);
    on("assignment:new", handleNewEmergency);
    on("incident:created", handleNewEmergency);
    on("emergency:new", handleNewEmergency);

    return () => {
      off("ambulance:requested", handleNewEmergency);
      off("ambulance:assignment", handleNewEmergency);
      off("assignment:new", handleNewEmergency);
      off("incident:created", handleNewEmergency);
      off("emergency:new", handleNewEmergency);
    };
  }, [socket, ambulanceId, on, off, emit, refetch]);

  // Merge socket incidents with API active incidents
  const allCombinedIncidents = [
    ...liveIncidents,
    ...apiActiveIncidents.filter((ai) => !liveIncidents.some((li) => li._id === ai._id)),
  ];

  // Active callout spotlight (direct pending assignment to this unit takes highest priority)
  const pendingAssignmentObj = pendingRequest
    ? (pendingRequest.incidentId && typeof pendingRequest.incidentId === "object"
        ? { ...pendingRequest.incidentId, _id: pendingRequest.incidentId._id || pendingRequest._id, assignmentId: pendingRequest._id }
        : { _id: pendingRequest._id, assignmentId: pendingRequest._id })
    : null;

  const activeCallout =
    pendingAssignmentObj ||
    selectedIncident ||
    allCombinedIncidents[0] ||
    null;

  const incidentCoords = activeCallout?.location?.coordinates
    ? [activeCallout.location.coordinates[1], activeCallout.location.coordinates[0]]
    : null;

  const [radarRoadRoute, setRadarRoadRoute] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (driverPos && incidentCoords) {
      fetchRoadRoute(driverPos, incidentCoords).then((pts) => {
        if (isMounted && pts && pts.length > 0) {
          setRadarRoadRoute(pts);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [driverPos[0], driverPos[1], incidentCoords?.[0], incidentCoords?.[1]]);

  const distanceKm = radarRoadRoute.length > 1
    ? calculateRouteDistanceKm(radarRoadRoute)
    : incidentCoords
    ? calculateDistanceKm(driverPos[0], driverPos[1], incidentCoords[0], incidentCoords[1])
    : "2.4";

  const handleAccept = async (id) => {
    try {
      const targetAssignmentId = pendingRequest?._id || activeCallout?.assignmentId;
      if (targetAssignmentId) {
        await acceptAssignment(targetAssignmentId).unwrap();
        toast.success("Emergency accepted! Navigation engaged.");
        refetch();
        navigate(`/ambulance/run/${targetAssignmentId}`);
      } else {
        toast.success("Emergency acknowledged! Route locked on HUD.");
      }
    } catch {
      toast.error("Could not accept assignment");
    }
  };

  const handleDecline = async (id) => {
    try {
      if (pendingRequest) {
        await rejectAssignment({ id: pendingRequest._id, reason: "Declined by driver" }).unwrap();
      }
      setLiveIncidents((prev) => prev.filter((i) => i._id !== id));
      setSelectedIncident(null);
      toast.info("Emergency request declined and returned to dispatch pool");
      refetch();
    } catch {
      toast.error("Could not decline assignment");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. URGENT INCOMING EMERGENCY CALLOUT CARD */}
      {activeCallout && (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emergency-950/90 via-dark-900 to-dark-900 border-2 border-emergency-500 shadow-2xl shadow-emergency-950/50 space-y-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emergency-500 animate-ping" />
              <span className="text-xs font-mono font-extrabold text-emergency-400 uppercase tracking-widest">
                🚨 NEW INCOMING EMERGENCY CALLOUT
              </span>
            </div>
            <PriorityBadge priority="CRITICAL" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              {activeCallout.type || "Trauma Scene Callout"}
            </h2>
            <p className="text-xs text-dark-300 mt-1 line-clamp-1 font-mono">
              📍 {activeCallout.location?.address || "Dispatched GPS Scene Coordinates"}
            </p>
          </div>

          {/* Quick Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-dark-900/80 border border-dark-700 text-xs font-mono">
            <div>
              <span className="text-dark-500 block text-[10px] uppercase">Distance</span>
              <span className="text-cyan-400 font-bold text-sm">~{distanceKm} km away</span>
            </div>
            <div>
              <span className="text-dark-500 block text-[10px] uppercase">Estimated Time</span>
              <span className="text-white font-bold text-sm">~{Math.max(2, Math.ceil(distanceKm * 2.2))} mins</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-dark-500 block text-[10px] uppercase">Incident Case</span>
              <span className="text-emergency-400 font-bold text-sm truncate block">
                #{activeCallout._id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isRejecting}
              onClick={() => handleDecline(activeCallout._id)}
              className="w-full sm:w-1/3 py-3.5 rounded-xl border border-dark-600 hover:bg-dark-800 text-dark-300 hover:text-emergency-400 font-bold text-xs uppercase tracking-wider transition"
            >
              Decline Callout
            </button>

            <button
              type="button"
              disabled={isAccepting}
              onClick={() => handleAccept(activeCallout._id)}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Accept & Start Navigation</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. LIVE EMERGENCY DISPATCH RADAR MAP */}
      <div className="h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-dark-700 shadow-2xl relative">
        <MapContainer
          center={incidentCoords || driverPos}
          zoom={incidentCoords ? 13 : 15}
          className="w-full h-full"
        >
          {/* 1. All Registered Hospitals */}
          {hospitals.map((hosp) => {
            const coords = hosp.location?.coordinates
              ? [hosp.location.coordinates[1], hosp.location.coordinates[0]]
              : null;
            if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;
            return (
              <HospitalMarker
                key={hosp._id || hosp.id}
                position={coords}
                name={hosp.name}
                traumaLevel={hosp.capability?.traumaLevel || "LEVEL_1"}
                bedsAvailable={hosp.capability?.beds?.emergency ?? null}
              />
            );
          })}

          {/* 2. All Live Incidents */}
          {allCombinedIncidents.map((inc) => {
            let coords = null;
            if (inc.location?.coordinates) {
              coords = [inc.location.coordinates[1], inc.location.coordinates[0]];
            } else if (inc.location?.latitude && inc.location?.longitude) {
              coords = [Number(inc.location.latitude), Number(inc.location.longitude)];
            }
            if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;
            return (
              <UserMarker
                key={inc._id}
                position={coords}
                label={`${inc.type || inc.description || "Trauma"} (#${inc._id.slice(-6).toUpperCase()})`}
                onClick={() => setSelectedIncident(inc)}
              />
            );
          })}

          {/* 3. Driver's own ambulance */}
          <AmbulanceMarker
            position={driverPos}
            plateNumber="YOUR AMBULANCE (ONLINE)"
            speed={0}
          />

          {/* 4. Active Navigation Route Polyline */}
          {incidentCoords && (
            <RoutePolyline
              positions={radarRoadRoute.length > 1 ? radarRoadRoute : [driverPos, incidentCoords]}
              color="#EF4444"
              weight={5}
              opacity={0.9}
            />
          )}
        </MapContainer>

        {/* Live Radar Overlay Status */}
        <div className="absolute top-4 left-4 z-[400] px-3.5 py-2 rounded-xl bg-dark-950/85 backdrop-blur-md border border-dark-700 text-xs font-mono flex items-center space-x-2 shadow-lg">
          <span
            className={`w-2 h-2 rounded-full ${
              incidentCoords ? "bg-emergency-500 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="font-bold text-white">
            {incidentCoords ? "LIVE CALLOUT IN RANGE" : "DISPATCH UNIT ONLINE • STANDBY"}
          </span>
        </div>

        {incidentCoords && (
          <div className="absolute top-4 right-4 z-[400] px-3.5 py-2 rounded-xl bg-dark-950/85 backdrop-blur-md border border-dark-700 text-cyan-300 font-mono font-bold text-xs flex items-center space-x-2 shadow-lg">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{distanceKm} km • ~{Math.max(2, Math.ceil(distanceKm * 2.2))} mins ETA</span>
          </div>
        )}
      </div>

      {/* 3. ACTIVE RUN BANNER (If trip in progress) */}
      {currentRun && (
        <div className="p-6 rounded-2xl bg-dark-900 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                TRIP IN PROGRESS • #{currentRun._id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              En Route to Patient Scene / Hospital
            </h3>
            <p className="text-xs text-dark-300 mt-0.5">
              Current lifecycle status: <strong className="text-white uppercase">{currentRun.status}</strong>
            </p>
          </div>

          <Link
            to={`/ambulance/run/${currentRun._id}`}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <Navigation className="w-4 h-4" />
            <span>Open Navigation HUD</span>
          </Link>
        </div>
      )}

      {/* 4. SHIFT SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/80">
          <span className="text-[10px] text-dark-400 font-mono uppercase block">Assigned Today</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {assignments.length + liveIncidents.length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/80">
          <span className="text-[10px] text-dark-400 font-mono uppercase block">Completed Runs</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {assignments.filter((a) => a.status === "COMPLETED").length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/80">
          <span className="text-[10px] text-dark-400 font-mono uppercase block">Live GPS Telemetry</span>
          <span className="text-xs font-black text-cyan-400 font-mono mt-1.5 block truncate">
            {driverPos[0]?.toFixed(4)}, {driverPos[1]?.toFixed(4)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/80">
          <span className="text-[10px] text-dark-400 font-mono uppercase block">Unit Status</span>
          <span className="text-sm font-black text-emerald-400 font-mono mt-1.5 block">
            READY TO DISPATCH
          </span>
        </div>
      </div>

      {/* 5. RECENT CALLOUTS LOG */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Recent Trip Dispatches & Live Radar
        </h3>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : assignments.length === 0 && liveIncidents.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No dispatches yet"
            description="Keep your unit status set to Online to receive automated emergency callouts."
          />
        ) : (
          <div className="space-y-2.5">
            {/* Real-time incoming callouts first */}
            {liveIncidents.map((inc) => (
              <div
                key={inc._id}
                onClick={() => setSelectedIncident(inc)}
                className="p-4 rounded-xl bg-dark-900 border border-emergency-500/50 hover:border-emergency-500 transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emergency-600/20 flex items-center justify-center text-emergency-400 shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Case #{inc._id.slice(-6).toUpperCase()} — {inc.type || "Trauma Emergency"}
                    </span>
                    <span className="text-[10px] text-dark-300 font-mono line-clamp-1">
                      {inc.location?.address || "Live coordinates on map"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded-full bg-emergency-500/20 text-emergency-400 font-mono text-[10px] font-bold">
                    IN RADAR
                  </span>
                  <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}

            {assignments.slice(0, 6).map((run) => (
              <div
                key={run._id}
                onClick={() => navigate(`/ambulance/run/${run._id}`)}
                className="p-4 rounded-xl bg-dark-900/60 hover:bg-dark-800 border border-dark-700/70 hover:border-dark-600 transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center text-dark-300 group-hover:text-cyan-400 transition">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Incident #{run.incidentId?.toString().slice(-6).toUpperCase() || "RQ-01"}
                    </span>
                    <span className="text-[10px] text-dark-400 font-mono">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={run.status} />
                  <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
