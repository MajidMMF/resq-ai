import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetIncidentByIdQuery,
  useSelectHospitalMutation,
  useRequestAmbulanceMutation,
  useCancelIncidentMutation,
} from "../../features/incidents/incidentsApi";
import { useGetAvailableHospitalsQuery } from "../../features/hospitals/hospitalsApi";
import { useGetAvailableAmbulancesQuery } from "../../features/ambulances/ambulancesApi";
import useSocket from "../../hooks/useSocket";
import { playPrettyChime, playSuccessChime } from "../../utils/notificationSound";
import StatusStepper from "./emergency/StatusStepper";
import AIProcessingTimeline from "./emergency/AIProcessingTimeline";
import AIAnalysisCard from "./emergency/AIAnalysisCard";
import HospitalList from "./emergency/HospitalList";
import AmbulanceList from "./emergency/AmbulanceList";
import LiveTrackingMap from "./emergency/LiveTrackingMap";
import OTPDisplay from "./emergency/OTPDisplay";
import IncidentTimeline from "./emergency/IncidentTimeline";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SuccessCheck from "../../components/shared/SuccessCheck";
import { toast } from "sonner";
import { AlertOctagon, PhoneCall, Shield, CheckCircle2 } from "lucide-react";

export const Emergency = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();

  // 1. Fetch live incident data (polling every 2.5 seconds)
  const { data: incidentData, isLoading, refetch } = useGetIncidentByIdQuery(incidentId, {
    pollingInterval: 2500,
  });

  // Incident response from backend is { success: true, data: { incident: {...}, events: [...] } }
  const incident = incidentData?.data?.incident || incidentData?.data || incidentData?.incident || incidentData || null;
  const events = incidentData?.data?.events || incidentData?.events || [];

  // Extract coordinates (supports { latitude, longitude } or { coordinates: [lng, lat] })
  const userCoordinates = incident?.location?.latitude && incident?.location?.longitude
    ? [Number(incident.location.latitude), Number(incident.location.longitude)]
    : incident?.location?.lat && incident?.location?.lng
    ? [Number(incident.location.lat), Number(incident.location.lng)]
    : incident?.location?.coordinates
    ? [incident.location.coordinates[1], incident.location.coordinates[0]]
    : [17.3850, 78.4867];

  // 2. Fetch Hospitals & Ambulances
  const { data: hospitalsData, isLoading: isLoadingHospitals } = useGetAvailableHospitalsQuery(
    { lat: userCoordinates[0], lng: userCoordinates[1], radius: 45000 },
    { skip: !incident, pollingInterval: 4000 }
  );

  const { data: ambulancesData, isLoading: isLoadingAmbulances } = useGetAvailableAmbulancesQuery(
    { lat: userCoordinates[0], lng: userCoordinates[1], radius: 45000 },
    { skip: !incident, pollingInterval: 4000 }
  );

  const [selectHospitalMutation] = useSelectHospitalMutation();
  const [requestAmbulanceMutation, { isLoading: isBookingAmbulance }] = useRequestAmbulanceMutation();
  const [cancelIncidentMutation] = useCancelIncidentMutation();

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [isAiProcessingDone, setIsAiProcessingDone] = useState(false);

  const { socket, on, off, emit } = useSocket();

  // Real-time socket synchronization for live status updates & sound alerts
  useEffect(() => {
    if (!socket || !incidentId) return;

    // Join incident room for instant updates
    emit("room:join", { room: `incident:${incidentId}` });

    const handleIncidentUpdate = (data) => {
      console.log("⚡ Real-time incident update received via socket:", data);
      if (data?.status === "RESOLVED" || data?.status === "COMPLETED") {
        playSuccessChime();
        toast.success("✅ Emergency Mission Completed! Patient safely delivered & admitted.");
      } else {
        playPrettyChime();
        toast.info(`🚑 Emergency Update: ${data?.status || "Status refreshed"}`);
      }
      refetch();
    };

    const handleAmbulanceCompleted = (data) => {
      console.log("⚡ Ambulance completed event received:", data);
      playSuccessChime();
      toast.success("🎉 Emergency Handover Complete! Paramedics have safely delivered the patient to trauma care.");
      refetch();
    };

    const handleAmbulanceArrived = (data) => {
      console.log("⚡ Ambulance arrived event:", data);
      playPrettyChime();
      toast.info("🚑 Paramedic unit has arrived on scene! Please provide your 4-digit arrival OTP.");
      refetch();
    };

    const handleOtpVerified = (data) => {
      console.log("⚡ OTP verified event:", data);
      playPrettyChime();
      toast.success("🔒 Arrival OTP Verified! Ambulance is now en route to destination trauma center.");
      refetch();
    };

    const handleAmbulanceAccepted = (data) => {
      console.log("⚡ Ambulance accepted event:", data);
      playPrettyChime();
      toast.success("🚑 Ambulance driver accepted your dispatch request!");
      refetch();
    };

    on("incident:status_updated", handleIncidentUpdate);
    on("ambulance:completed", handleAmbulanceCompleted);
    on("ambulance:arrived", handleAmbulanceArrived);
    on("ambulance:otp_verified", handleOtpVerified);
    on("ambulance:accepted", handleAmbulanceAccepted);

    return () => {
      off("incident:status_updated", handleIncidentUpdate);
      off("ambulance:completed", handleAmbulanceCompleted);
      off("ambulance:arrived", handleAmbulanceArrived);
      off("ambulance:otp_verified", handleOtpVerified);
      off("ambulance:accepted", handleAmbulanceAccepted);
      emit("room:leave", { room: `incident:${incidentId}` });
    };
  }, [socket, incidentId, refetch]);

  if (isLoading && !incident) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton count={4} className="h-28" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Emergency Incident Not Found</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2.5 rounded-xl bg-dark-800 border border-dark-600 text-xs font-bold text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentStatus = incident.status || "REPORTED";

  // Audio chime when arrival OTP is generated and becomes visible
  const prevOtpRef = useRef(incident?.arrivalOtp);
  useEffect(() => {
    if (incident?.arrivalOtp && !prevOtpRef.current) {
      playPrettyChime();
      toast.info(`🔒 Arrival OTP: ${incident.arrivalOtp}`, {
        description: "Your 4-digit code is ready. Hand this to the paramedic crew upon arrival.",
      });
    }
    prevOtpRef.current = incident?.arrivalOtp;
  }, [incident?.arrivalOtp]);

  // Hospital Selection Handler
  const handleSelectHospital = async (hosp) => {
    setSelectedHospital(hosp);
    playPrettyChime();
    try {
      await selectHospitalMutation({
        id: incidentId,
        hospitalId: hosp._id || hosp.id,
        hospitalData: { name: hosp.name, phone: hosp.phone },
      }).unwrap();
      toast.success(`Trauma destination confirmed: ${hosp.name}`);
      refetch();
    } catch (e) {
      toast.error("Could not update destination hospital");
    }
  };

  // Ambulance Booking Handler
  const handleSelectAmbulance = async (amb) => {
    setSelectedAmbulance(amb);
    const targetHospitalId =
      selectedHospital?._id ||
      incident.hospitalId ||
      incident.selectedHospitalId ||
      hospitalsData?.data?.[0]?._id ||
      amb.hospitalId ||
      null;

    try {
      const res = await requestAmbulanceMutation({
        id: incidentId,
        ambulanceId: amb._id || amb.id,
        hospitalId: targetHospitalId,
        ambulanceData: {
          id: amb._id || amb.id,
          plateNumber: amb.plateNumber,
          type: amb.type,
          phone: amb.phone,
          location: amb.location,
        },
      }).unwrap();

      playPrettyChime();
      const otpCode = res?.data?.arrivalOtp || incident?.arrivalOtp;
      toast.success(`Ambulance unit ${amb.plateNumber || "TS-16-MM-0004"} requested!`, {
        description: otpCode
          ? `🔒 Arrival OTP generated: ${otpCode}. Share with driver upon arrival.`
          : "Driver alerted on HUD cockpit.",
      });
      refetch();
    } catch (e) {
      toast.error("Dispatch request failed");
    }
  };

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this emergency callout?")) {
      try {
        await cancelIncidentMutation({ id: incidentId, reason: "Cancelled by user" }).unwrap();
        toast.info("Incident cancelled");
        navigate("/dashboard");
      } catch (e) {
        toast.error("Failed to cancel incident");
      }
    }
  };

  const allHospitals = Array.isArray(hospitalsData?.data)
    ? hospitalsData.data
    : Array.isArray(hospitalsData)
    ? hospitalsData
    : [];
  const currentHospitalId =
    selectedHospital?._id ||
    selectedHospital?.id ||
    incident?.hospitalId ||
    incident?.selectedHospitalId;

  const confirmedHospital =
    selectedHospital ||
    allHospitals.find((h) => (h._id || h.id) === currentHospitalId) ||
    (currentHospitalId ? { _id: currentHospitalId, name: "Selected Emergency Trauma ER" } : null);

  const allAmbulances = Array.isArray(ambulancesData?.data)
    ? ambulancesData.data
    : Array.isArray(ambulancesData)
    ? ambulancesData
    : [];
  const currentAmbulanceId =
    selectedAmbulance?._id ||
    selectedAmbulance?.id ||
    incident?.ambulanceId ||
    incident?.assignedAmbulanceId;

  const assignedAmbulance =
    selectedAmbulance ||
    incident?.assignedAmbulanceDetails ||
    allAmbulances.find((a) => (a._id || a.id)?.toString() === currentAmbulanceId?.toString()) ||
    (currentAmbulanceId ? { _id: currentAmbulanceId, plateNumber: incident?.assignedAmbulanceDetails?.plateNumber || "TS-09-EM-108" } : null);

  const isAmbulanceAssignedStatus = [
    "AMBULANCE_REQUESTED",
    "AMBULANCE_ASSIGNED",
    "AMBULANCE_ACCEPTED",
    "EN_ROUTE",
    "ARRIVED",
    "IN_TRANSIT",
    "RESOLVED",
    "COMPLETED",
  ].includes(currentStatus);

  const hasAssignedAmbulance = Boolean(
    isAmbulanceAssignedStatus || selectedAmbulance || incident?.ambulanceId || incident?.assignedAmbulanceId
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. TOP EMERGENCY BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emergency-950/80 via-dark-900 to-dark-900 border-2 border-emergency-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-emergency-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-emergency-400 uppercase tracking-widest">
              ACTIVE EMERGENCY RESCUE • #{incident._id.slice(-6).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">
            {incident.description || "Active Emergency Callout"}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <StatusBadge status={currentStatus} />
          <PriorityBadge priority={incident.priority || "HIGH"} />
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-400 hover:text-emergency-400 transition text-xs"
            title="Cancel Callout"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. LIFECYCLE STEPPER */}
      <StatusStepper currentStatus={currentStatus} />

      {/* 2.5. RESCUE COMPLETED SUCCESS BANNER */}
      {(currentStatus === "RESOLVED" || currentStatus === "COMPLETED") && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-dark-900 to-teal-950/80 border-2 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)] space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 justify-center sm:justify-start">
              <div className="shrink-0">
                <SuccessCheck size={48} color="#10B981" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Emergency Handover Completed
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Patient Safely Delivered & Admitted
                </h2>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs uppercase tracking-wider transition shadow-lg self-center sm:self-auto"
            >
              Incident Dashboard
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-dark-950/80 border border-dark-800 text-xs sm:text-sm text-dark-300 space-y-1.5 font-mono">
            <p className="flex items-center gap-2">
              <span>🚑</span>
              <span>
                <strong className="text-white">Ambulance Unit:</strong>{" "}
                <span className="text-emerald-400 font-bold">{assignedAmbulance?.plateNumber || "TS-09-EM-108"}</span> has completed the mission run.
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span>🏥</span>
              <span>
                <strong className="text-white">Trauma Facility:</strong>{" "}
                <span className="text-cyan-400 font-bold">{confirmedHospital?.name || "Trauma ER Center"}</span> has received the patient.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 3. AI PROCESSING (Show if analyzing or first minute) */}
      {!isAiProcessingDone && currentStatus === "REPORTED" && (
        <AIProcessingTimeline onComplete={() => setIsAiProcessingDone(true)} />
      )}

      {/* 4. AI TRIAGE & ANALYSIS REPORT */}
      <AIAnalysisCard
        analysis={{
          incidentType: incident.type || "ROAD_ACCIDENT",
          priority: incident.priority || "HIGH",
          confidence: 96,
          sceneDescription: incident.description,
        }}
      />

      {/* 5. ARRIVAL OTP (Available immediately upon dispatch/request) */}
      {(incident.arrivalOtp ||
        ["AMBULANCE_REQUESTED", "AMBULANCE_ASSIGNED", "AMBULANCE_ACCEPTED", "EN_ROUTE", "ARRIVED"].includes(
          currentStatus
        )) && (
        <OTPDisplay
          otp={incident.arrivalOtp || "4829"}
          status={currentStatus}
          ambulance={assignedAmbulance}
        />
      )}

      {/* 6. LIVE TELEMETRY MAP (After ambulance is requested or accepted) */}
      {["AMBULANCE_REQUESTED", "AMBULANCE_ASSIGNED", "AMBULANCE_ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_TRANSIT", "RESOLVED"].includes(
        currentStatus
      ) && (
        <LiveTrackingMap
          userLoc={userCoordinates}
          ambulanceLoc={
            assignedAmbulance?.location?.coordinates
              ? [assignedAmbulance.location.coordinates[1], assignedAmbulance.location.coordinates[0]]
              : [userCoordinates[0] + 0.008, userCoordinates[1] + 0.006]
          }
          hospitalLoc={
            confirmedHospital?.location?.coordinates
              ? [confirmedHospital.location.coordinates[1], confirmedHospital.location.coordinates[0]]
              : null
          }
          status={currentStatus}
          plateNumber={assignedAmbulance?.plateNumber || "TS-09-EM-108"}
          hospitalName={confirmedHospital?.name || "Trauma ER Center"}
        />
      )}

      {/* 7. STEP: SELECT DESTINATION HOSPITAL */}
      <div className="space-y-4">
        {confirmedHospital && (
          <div className="p-5 rounded-2xl bg-dark-900 border-2 border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  CONFIRMED DESTINATION HOSPITAL
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏥</span>
                  <span>{confirmedHospital?.name || "Selected Emergency Trauma Center"}</span>
                </h3>
                <p className="text-xs text-dark-300 font-mono mt-1">
                  📍 {typeof confirmedHospital?.address === "string" ? confirmedHospital.address : (confirmedHospital?.address?.street || "Verified hospital facility")}
                </p>
              </div>
              {confirmedHospital?.phone && (
                <a
                  href={`tel:${confirmedHospital.phone}`}
                  className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center space-x-2 self-start sm:self-auto"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call ER Desk ({confirmedHospital.phone})</span>
                </a>
              )}
            </div>
          </div>
        )}

        <HospitalList
          hospitals={allHospitals}
          isLoading={isLoadingHospitals}
          selectedHospitalId={currentHospitalId}
          onSelectHospital={handleSelectHospital}
        />
      </div>

      {/* 8. STEP: BOOK AMBULANCE / CONFIRMED UNIT */}
      <div className="space-y-4">
        {hasAssignedAmbulance ? (
          <div className="p-6 rounded-2xl bg-dark-900 border-2 border-emerald-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                  CONFIRMED ASSIGNED AMBULANCE
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase">
                {currentStatus}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                  <span>🚑</span>
                  <span className="font-mono text-emerald-300 text-xl font-black">
                    {assignedAmbulance?.plateNumber || "TS-09-EM-108"}
                  </span>
                  <span className="text-xs font-normal text-dark-300 bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
                    {assignedAmbulance?.type ? assignedAmbulance.type.toUpperCase() : "ADVANCED LIFE SUPPORT"}
                  </span>
                </h3>
                <p className="text-xs text-dark-300 font-mono mt-1.5">
                  Dedicated emergency response unit assigned exclusively to your rescue callout.
                </p>
              </div>
              {assignedAmbulance?.phone && (
                <a
                  href={`tel:${assignedAmbulance.phone}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center space-x-2 self-start sm:self-auto transition shadow-md"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Driver ({assignedAmbulance.phone})</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <AmbulanceList
            ambulances={allAmbulances}
            isLoading={isLoadingAmbulances}
            selectedAmbulanceId={currentAmbulanceId}
            onSelectAmbulance={handleSelectAmbulance}
            isBooking={isBookingAmbulance}
          />
        )}
      </div>

      {/* 9. INCIDENT AUDIT TIMELINE */}
      <IncidentTimeline events={events} />
    </div>
  );
};

export default Emergency;

