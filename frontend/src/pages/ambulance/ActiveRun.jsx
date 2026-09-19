import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetMyAssignmentsQuery,
  useStartTripMutation,
  useArriveAtSceneMutation,
  useVerifyArrivalOtpMutation,
  useCompleteTripMutation,
} from "../../features/ambulances/ambulancesApi";
import { useGetIncidentByIdQuery } from "../../features/incidents/incidentsApi";
import MapContainer from "../../components/maps/MapContainer";
import AmbulanceMarker from "../../components/maps/AmbulanceMarker";
import UserMarker from "../../components/maps/UserMarker";
import HospitalMarker from "../../components/maps/HospitalMarker";
import RoutePolyline from "../../components/maps/RoutePolyline";
import { fetchRoadRoute } from "../../utils/roadRouting";
import ArrivalOtpModal from "../../components/shared/ArrivalOtpModal";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Navigation,
  CheckCircle2,
  KeyRound,
  Hospital,
  AlertTriangle,
  Clock,
  Phone,
  ArrowLeft,
  Loader2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export const ActiveRun = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Polling assignment data
  const { data: assignmentsData, isLoading: isLoadingAssignments, refetch } =
    useGetMyAssignmentsQuery(undefined, { pollingInterval: 3000 });

  const assignments = assignmentsData?.data || assignmentsData || [];
  const assignment = assignments.find((a) => a._id === id) || null;

  // Incident details (scene location, description, patient info)
  const incidentId = assignment?.incidentId?._id || assignment?.incidentId;
  const { data: incidentData } = useGetIncidentByIdQuery(incidentId, {
    skip: !incidentId,
    pollingInterval: 5000,
  });
  const incident = incidentData?.data || incidentData || null;

  // Mutations
  const [startTrip, { isLoading: isStarting }] = useStartTripMutation();
  const [arriveAtScene, { isLoading: isArriving }] = useArriveAtSceneMutation();
  const [verifyArrivalOtp, { isLoading: isVerifyingOtp }] = useVerifyArrivalOtpMutation();
  const [completeTrip, { isLoading: isCompleting }] = useCompleteTripMutation();

  // Local state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // Live driver coords (fallback: AIIMS New Delhi)
  const [driverPos, setDriverPos] = useState([28.5672, 77.21]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn("ActiveRun GPS watch error:", err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Coordinates
  const scenePos = incident?.location?.coordinates && incident.location.coordinates.length >= 2
    ? [incident.location.coordinates[1], incident.location.coordinates[0]]
    : incident?.location?.latitude && incident?.location?.longitude
    ? [Number(incident.location.latitude), Number(incident.location.longitude)]
    : [17.5196, 78.4468]; // Hyderabad scene default

  const hospitalPos =
    assignment?.hospitalId?.location?.coordinates && assignment.hospitalId.location.coordinates.length >= 2
      ? [assignment.hospitalId.location.coordinates[1], assignment.hospitalId.location.coordinates[0]]
      : incident?.hospitalId?.location?.coordinates && incident.hospitalId.location.coordinates.length >= 2
      ? [incident.hospitalId.location.coordinates[1], incident.hospitalId.location.coordinates[0]]
      : [17.4156, 78.4482]; // Hyderabad Emergency Trauma Center

  const hospitalName =
    assignment?.hospitalId?.name ||
    incident?.hospitalId?.name ||
    incident?.selectedHospitalId?.name ||
    "Care Hospital Emergency Unit";

  // Map route points depending on assignment state
  const isEnRouteHospital = assignment?.status === "OTP_VERIFIED" || (assignment?.status === "EN_ROUTE" && assignment?.arrivedAt);
  const targetDestination = isEnRouteHospital ? hospitalPos : scenePos;
  const [roadRoute, setRoadRoute] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (driverPos && targetDestination) {
      fetchRoadRoute(driverPos, targetDestination).then((pts) => {
        if (isMounted && pts && pts.length > 0) {
          setRoadRoute(pts);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [driverPos[0], driverPos[1], targetDestination[0], targetDestination[1]]);

  const routePoints = roadRoute.length > 1 ? roadRoute : [driverPos, targetDestination];

  // Action handlers
  const handleStartTrip = async () => {
    try {
      await startTrip(id).unwrap();
      toast.success("Trip engaged! Route to accident scene activated.");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to start trip");
    }
  };

  const handleArrived = async () => {
    try {
      await arriveAtScene(id).unwrap();
      toast.success("Arrived at scene! Prompting citizen for Arrival OTP.");
      setIsOtpModalOpen(true);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to mark arrival");
    }
  };

  const handleVerifyOtp = async (code) => {
    try {
      await verifyArrivalOtp({ id, otp: code }).unwrap();
      toast.success("Arrival verified! Patient boarded — Proceed to Hospital.");
      setIsOtpModalOpen(false);
      refetch();
    } catch (err) {
      const remaining = err?.data?.attemptsLeft ?? attemptsLeft - 1;
      setAttemptsLeft(remaining);
      toast.error(err?.data?.message || `Invalid code! ${remaining} attempt(s) left`);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTrip(id).unwrap();
      toast.success("Emergency run completed! Unit returned to available pool.");
      refetch();
      navigate("/ambulance");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to complete trip");
    }
  };

  const openGoogleMaps = () => {
    const lat = targetDestination[0];
    const lng = targetDestination[1];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  if (isLoadingAssignments && !assignment) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={3} className="h-40" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 rounded-2xl bg-dark-900 border border-dark-700 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-emergency-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Callout Not Found</h2>
        <p className="text-xs text-dark-400">
          This dispatch assignment may have been completed, cancelled, or assigned to another crew.
        </p>
        <button
          onClick={() => navigate("/ambulance")}
          className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-bold text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* 1. TOP HEADER & STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/ambulance")}
            className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Run #{assignment._id.slice(-6).toUpperCase()}
              </span>
              <PriorityBadge priority={incident?.aiTriage?.priority || "CRITICAL"} />
            </div>
            <p className="text-[11px] text-dark-400 font-mono">
              Scene: {incident?.location?.address || "Coordinates Dispatched"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <StatusBadge status={assignment.status} />
          <button
            onClick={openGoogleMaps}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono font-bold flex items-center space-x-1.5 transition"
          >
            <span>Turn-by-Turn</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. DUAL INTERFACE: INTERACTIVE HUD MAP & TELEMATICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAP HUD (2 COLS) */}
        <div className="lg:col-span-2 h-[420px] sm:h-[500px] rounded-2xl overflow-hidden border border-dark-700 shadow-2xl relative z-0">
          <MapContainer
            center={driverPos}
            zoom={14}
            bounds={routePoints.length > 1 ? routePoints : [driverPos, targetDestination]}
            className="w-full h-full"
          >
            <AmbulanceMarker position={driverPos} plateNumber="YOUR AMBULANCE" speed={45} />
            <UserMarker
              position={scenePos}
              label={incident?.location?.address || "Patient Scene"}
            />
            <HospitalMarker
              position={hospitalPos}
              name={hospitalName}
              traumaLevel="LEVEL_1"
              bedsAvailable={4}
            />
            <RoutePolyline
              positions={routePoints}
              color={isEnRouteHospital ? "#10B981" : "#EF4444"}
              dashArray="8, 8"
            />
          </MapContainer>

          {/* Floating Navigation Overlay Badge */}
          <div className="absolute top-4 left-4 z-[400] px-3 py-2 rounded-xl bg-dark-950/85 backdrop-blur-md border border-dark-700 shadow-xl flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-white">
              {isEnRouteHospital ? `DESTINATION: ${hospitalName}` : "DESTINATION: ACCIDENT SCENE"}
            </span>
          </div>
        </div>

        {/* TELEMETRY & ACTIONS SIDEBAR (1 COL) */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Incident / Patient Quick Specs */}
          <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
            <h3 className="text-xs font-mono font-bold text-dark-400 uppercase tracking-wider">
              Dispatched Incident Data
            </h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {incident?.location?.address || "Coordinates Dispatched"}
                  </span>
                  <span className="text-[10px] text-dark-400 font-mono">
                    {incident?.type || "Road Traffic Collision / Trauma"}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-dark-400 shrink-0" />
                <span className="text-xs text-dark-300 font-mono">
                  Dispatched: {new Date(assignment.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {incident?.userContact && (
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={`tel:${incident.userContact}`}
                    className="text-xs text-emerald-400 font-bold hover:underline font-mono"
                  >
                    Call Bystander: {incident.userContact}
                  </a>
                </div>
              )}
            </div>

            {incident?.description && (
              <div className="p-3 rounded-xl bg-dark-950/70 border border-dark-800 text-xs text-dark-300 leading-relaxed">
                "{incident.description}"
              </div>
            )}
          </div>

          {/* STAGE-DRIVEN ACTION BAR */}
          <div className="p-5 rounded-2xl bg-dark-900 border-2 border-dark-700 space-y-3">
            <span className="text-[10px] font-mono font-extrabold uppercase text-dark-400 tracking-wider block">
              Mission Actions
            </span>

            {/* Stage 1: Accepted -> Start Trip */}
            {assignment.status === "ACCEPTED" && (
              <button
                onClick={handleStartTrip}
                disabled={isStarting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    <span>Start Navigation to Scene</span>
                  </>
                )}
              </button>
            )}

            {/* Stage 2: En Route -> Mark Arrived */}
            {assignment.status === "EN_ROUTE" && !assignment.arrivedAt && (
              <button
                onClick={handleArrived}
                disabled={isArriving}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-amber-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {isArriving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    <span>Arrived at Scene</span>
                  </>
                )}
              </button>
            )}

            {/* Stage 3: Arrived -> Verify OTP Modal Launcher */}
            {assignment.status === "ARRIVED" && (
              <button
                onClick={() => setIsOtpModalOpen(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition animate-bounce"
              >
                <KeyRound className="w-5 h-5" />
                <span>Enter Citizen OTP</span>
              </button>
            )}

            {/* Stage 4: En route Hospital / OTP Verified -> Complete Trip */}
            {(assignment.status === "OTP_VERIFIED" ||
              (assignment.status === "EN_ROUTE" && assignment.arrivedAt)) && (
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {isCompleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Handover & Complete Mission</span>
                  </>
                )}
              </button>
            )}

            {assignment.status === "COMPLETED" && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold text-center">
                ✓ Emergency Callout Successfully Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. ARRIVAL OTP MODAL */}
      <ArrivalOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={handleVerifyOtp}
        isVerifying={isVerifyingOtp}
        attemptsLeft={attemptsLeft}
      />
    </div>
  );
};

export default ActiveRun;

