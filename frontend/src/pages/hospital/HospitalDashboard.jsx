import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useGetIncomingPatientsQuery,
  useAcceptIncomingPatientMutation,
  useMarkHospitalReadyMutation,
  useMarkHospitalUnavailableMutation,
  useGetMyHospitalQuery,
  useGetAvailableHospitalsQuery,
  useUpdateHospitalProfileMutation,
} from "../../features/hospitals/hospitalsApi";
import { useGetActiveIncidentsQuery } from "../../features/incidents/incidentsApi";
import { selectAudioAlertEnabled } from "../../features/hospitals/hospitalsSlice";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import MapContainer from "../../components/maps/MapContainer";
import HospitalMarker from "../../components/maps/HospitalMarker";
import AmbulanceMarker from "../../components/maps/AmbulanceMarker";
import UserMarker from "../../components/maps/UserMarker";
import RoutePolyline from "../../components/maps/RoutePolyline";
import HospitalLocationModal from "../../components/hospital/HospitalLocationModal";
import { playPrettyChime } from "../../utils/notificationSound";
import {
  Activity,
  AlertOctagon,
  Clock,
  Bed,
  CheckCircle2,
  XCircle,
  Phone,
  Navigation,
  Loader2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  User,
  HeartPulse,
  MapPin,
  Crosshair,
  Map as MapIcon,
} from "lucide-react";
import { toast } from "sonner";
import useSocket from "../../hooks/useSocket";

export const HospitalDashboard = () => {
  const audioAlertEnabled = useSelector(selectAudioAlertEnabled);

  // Poll incoming emergencies every 3.5 seconds
  const { data: incomingData, isLoading, refetch } = useGetIncomingPatientsQuery(undefined, {
    pollingInterval: 3500,
  });

  const { data: hospitalData } = useGetMyHospitalQuery();
  const hospital = hospitalData?.data?.hospital || hospitalData?.hospital || hospitalData?.data || {};

  const rawIncidents = incomingData?.data || incomingData || [];
  const [realtimeIncidents, setRealtimeIncidents] = useState([]);

  // Merge real-time socket incidents with polled incidents
  const incomingIncidents = [
    ...realtimeIncidents,
    ...rawIncidents.filter((inc) => !realtimeIncidents.some((r) => r._id === inc._id)),
  ];

  // Socket.IO realtime connection
  const { on, off } = useSocket();

  // Mutations
  const [acceptPatient, { isLoading: isAccepting }] = useAcceptIncomingPatientMutation();
  const [markReady, { isLoading: isMarkingReady }] = useMarkHospitalReadyMutation();
  const [markUnavailable, { isLoading: isDiverting }] = useMarkHospitalUnavailableMutation();

  // Selected incident for radar spotlight
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Ready action modal/state
  const [readyBay, setReadyBay] = useState("Trauma Bay 1");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(5);

  // Real-time socket listener for incoming trauma incidents
  useEffect(() => {
    const handleNewIncident = (data) => {
      const inc = data?.incident || data;
      if (!inc || !inc._id) return;

      console.log("🚨 [HospitalDashboard] Socket incident received:", inc);

      // Play pretty notification chime
      if (audioAlertEnabled) {
        playPrettyChime();
      }

      toast.error("🚨 CRITICAL TRAUMA INCIDENT REPORTED!", {
        description: inc.location?.address
          ? `${inc.type || "Trauma"}: ${inc.location.address.split(",").slice(0, 3).join(",")}`
          : "Immediate response required. Live incident pinned on radar map.",
        duration: 9000,
      });

      setRealtimeIncidents((prev) => {
        if (prev.some((p) => p._id === inc._id)) return prev;
        return [inc, ...prev];
      });

      setSelectedIncident(inc);
      refetch();
    };

    on("incident:created", handleNewIncident);
    on("emergency:new", handleNewIncident);
    on("incident:broadcast", handleNewIncident);

    return () => {
      off("incident:created", handleNewIncident);
      off("emergency:new", handleNewIncident);
      off("incident:broadcast", handleNewIncident);
    };
  }, [on, off, refetch]);

  // Keep first incoming incident selected by default if available
  useEffect(() => {
    if (incomingIncidents.length > 0 && !selectedIncident) {
      setSelectedIncident(incomingIncidents[0]);
    } else if (selectedIncident) {
      // Refresh current selection
      const updated = incomingIncidents.find((i) => i._id === selectedIncident._id);
      if (updated) setSelectedIncident(updated);
    }
  }, [incomingIncidents]);

  // Audio siren alert for new critical arrivals
  const prevCountRef = useRef(incomingIncidents.length);
  useEffect(() => {
    if (incomingIncidents.length > prevCountRef.current && audioAlertEnabled) {
      playPrettyChime();
    }
    prevCountRef.current = incomingIncidents.length;
  }, [incomingIncidents.length, audioAlertEnabled]);

  // Handler functions
  const handleAccept = async (incidentId) => {
    try {
      await acceptPatient({
        incidentId,
        estimatedPreparationTimeMinutes: prepTimeMinutes,
        notes: "Trauma team alerted. Bay pre-configured.",
      }).unwrap();
      toast.success("Patient acceptance confirmed! Notified ambulance & dispatch.");
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to accept patient");
    }
  };

  const handleMarkReady = async (incidentId) => {
    try {
      await markReady({
        incidentId,
        allocatedBed: readyBay,
        teamLead: "Chief Trauma Surgeon",
        readyDetails: "ICU Ventilator & 2 Units O-Negative blood prepped",
      }).unwrap();
      toast.success(`Trauma Bay marked READY (${readyBay})`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to mark bay ready");
    }
  };

  const handleDivert = async (incidentId) => {
    try {
      await markUnavailable({
        incidentId,
        reason: "Zero ICU beds available. Emergency diversion requested.",
        diversionSuggestion: "Safdarjung Hospital (Level 1)",
      }).unwrap();
      toast.warning("Patient diverted to secondary trauma facility");
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to divert patient");
    }
  };

  // Hospital location modal state & quick GPS sync
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [updateHospitalProfile] = useUpdateHospitalProfileMutation();
  const [isSyncingGps, setIsSyncingGps] = useState(false);

  const handleQuickGpsSync = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsSyncingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          let addressName = "";
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              addressName = geoData.display_name || "";
            }
          } catch (e) {}

          await updateHospitalProfile({
            latitude: lat,
            longitude: lng,
            ...(addressName ? { address: addressName } : {}),
          }).unwrap();

          toast.success("Hospital GPS Location Synchronized!", {
            description: addressName
              ? addressName.split(",").slice(0, 3).join(",")
              : `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
          });
          refetch();
        } catch (err) {
          toast.error("Failed to sync GPS location");
        } finally {
          setIsSyncingGps(false);
        }
      },
      (err) => {
        setIsSyncingGps(false);
        toast.error(`GPS Error: ${err.message}. You can pick location manually on the map.`);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Hospital position (from hospital.location.coordinates: [lng, lat])
  const hospitalCoords =
    hospital?.location?.coordinates &&
    !isNaN(hospital.location.coordinates[1]) &&
    !isNaN(hospital.location.coordinates[0])
      ? [hospital.location.coordinates[1], hospital.location.coordinates[0]]
      : [17.4773742, 78.5723865]; // Real Hyderabad default

  // Fetch all registered hospitals across the city
  const { data: allHospitalsData } = useGetAvailableHospitalsQuery(
    { lat: hospitalCoords[0], lng: hospitalCoords[1], radius: 50000 },
    { pollingInterval: 15000 }
  );
  const allRegisteredHospitals = Array.isArray(allHospitalsData?.data)
    ? allHospitalsData.data
    : Array.isArray(allHospitalsData)
    ? allHospitalsData
    : [];

  // Fetch all active incidents across the city
  const { data: activeIncidentsData } = useGetActiveIncidentsQuery(undefined, {
    pollingInterval: 3500,
  });
  const allActiveIncidents = Array.isArray(activeIncidentsData?.data)
    ? activeIncidentsData.data
    : Array.isArray(activeIncidentsData)
    ? activeIncidentsData
    : [];

  // Merge hospital's own incoming incidents with all active city incidents
  const allMapIncidents = [
    ...incomingIncidents,
    ...allActiveIncidents.filter((ai) => !incomingIncidents.some((ii) => ii._id === ai._id)),
  ];

  // Selected incident coords if active
  const hasIncident = Boolean(
    selectedIncident?.location?.coordinates &&
      !isNaN(selectedIncident.location.coordinates[1]) &&
      !isNaN(selectedIncident.location.coordinates[0])
  );

  const incidentCoords = hasIncident
    ? [selectedIncident.location.coordinates[1], selectedIncident.location.coordinates[0]]
    : null;

  // Simulated ambulance midway
  const ambulanceCoords =
    hasIncident && incidentCoords
      ? [
          (hospitalCoords[0] + incidentCoords[0]) / 2,
          (hospitalCoords[1] + incidentCoords[1]) / 2,
        ]
      : null;

  return (
    <div className="space-y-6">
      {/* 0. HOSPITAL FACILITY LOCATION STATUS BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-dark-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center text-emergency-400 shrink-0 mt-0.5 sm:mt-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h2 className="text-sm sm:text-base font-bold text-white font-sans">
                {hospital?.name || "Emergency Trauma Center"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIED MAP LOCATION
              </span>
            </div>
            <p className="text-xs text-dark-300 font-mono mt-0.5 line-clamp-1">
              {hospital?.address || "Address not configured"}
            </p>
            <div className="flex items-center space-x-3 text-[11px] font-mono text-cyan-400 mt-1">
              <span>Latitude: {hospitalCoords[0]?.toFixed(5)}</span>
              <span>•</span>
              <span>Longitude: {hospitalCoords[1]?.toFixed(5)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto shrink-0 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-bold text-white flex items-center space-x-1.5 transition shadow-sm"
          >
            <MapIcon className="w-4 h-4 text-cyan-400" />
            <span>Change / Pick on Map</span>
          </button>
          <button
            type="button"
            onClick={handleQuickGpsSync}
            disabled={isSyncingGps}
            className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {isSyncingGps ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4 text-cyan-400" />
            )}
            <span>Auto-Detect Live GPS</span>
          </button>
        </div>
      </div>

      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-dark-400 block">
              Inbound Trauma
            </span>
            <span className="text-2xl font-black text-emergency-400 font-mono mt-0.5 block">
              {incomingIncidents.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emergency-600/15 border border-emergency-500/30 flex items-center justify-center text-emergency-400">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-dark-400 block">
              ER Trauma Level
            </span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">
              LEVEL 1 (APEX)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-dark-400 block">
              ICU Ventilators
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
              6 Open
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bed className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-dark-400 block">
              Blood Bank Readiness
            </span>
            <span className="text-lg font-black text-purple-400 font-mono mt-0.5 block">
              O- / B+ READY
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. DUAL RADAR: INBOUND AMBULANCE QUEUE & RADAR MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INBOUND CALLOUT QUEUE (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping" />
              <span>Incoming Patients Radar ({incomingIncidents.length})</span>
            </h2>
            <button
              onClick={() => refetch()}
              className="text-[11px] text-cyan-400 hover:underline font-mono"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={3} className="h-28" />
          ) : incomingIncidents.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Inbound Trauma Calls"
              description="Emergency radar is scanning. Incoming ambulances and auto-dispatched patients will appear here in real time."
            />
          ) : (
            <div className="space-y-3">
              {incomingIncidents.map((incident) => {
                const isSelected = selectedIncident?._id === incident._id;
                const priority = incident?.aiTriage?.priority || "CRITICAL";

                return (
                  <div
                    key={incident._id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-dark-900 border-emergency-500 shadow-xl shadow-emergency-950/40"
                        : "bg-dark-900/70 border-dark-800 hover:border-dark-700"
                    }`}
                  >
                    {/* Active Selection Stripe */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emergency-500" />
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-white uppercase">
                        Case #{incident._id.slice(-6).toUpperCase()}
                      </span>
                      <PriorityBadge priority={priority} />
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {incident?.type || "Severe Trauma / Road Collision"}
                    </h3>

                    <p className="text-[11px] text-dark-400 font-mono mt-1 line-clamp-1">
                      {incident?.location?.address || "Dispatched GPS Coordinates"}
                    </p>

                    {/* ETA Countdown & Status */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-dark-800 text-xs font-mono">
                      <span className="text-cyan-400 font-bold flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>ETA: ~6 Mins</span>
                      </span>
                      <StatusBadge status={incident.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RADAR MAP & PRE-ARRIVAL ADMISSION CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Radar Map Container */}
          <div className="h-[340px] sm:h-[380px] rounded-2xl overflow-hidden border border-dark-700 shadow-2xl relative">
            <MapContainer
              center={hospitalCoords}
              zoom={hasIncident ? 13 : 14}
              className="w-full h-full"
            >
              {/* 1. Your Hospital Marker */}
              <HospitalMarker
                position={hospitalCoords}
                name={hospital?.name || "Your Emergency Trauma ER"}
                traumaLevel="LEVEL_1"
                bedsAvailable={6}
              />

              {/* 2. All Other Registered Hospitals */}
              {allRegisteredHospitals.map((hosp) => {
                if (hosp._id === hospital._id || hosp.name === hospital.name) return null;
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
                    bedsAvailable={hosp.capability?.beds ?? null}
                  />
                );
              })}

              {/* 3. Render ALL live incidents across the city on hospital radar map */}
              {allMapIncidents.map((inc) => {
                let coords = null;
                if (inc?.location?.coordinates) {
                  coords = [inc.location.coordinates[1], inc.location.coordinates[0]];
                } else if (inc?.location?.latitude && inc?.location?.longitude) {
                  coords = [Number(inc.location.latitude), Number(inc.location.longitude)];
                }
                if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;
                const isSelected = selectedIncident?._id === inc._id;
                const label = `${inc.type || inc.description || "Trauma"} (#${inc._id.slice(-6).toUpperCase()})`;
                return (
                  <UserMarker
                    key={inc._id}
                    position={coords}
                    label={label}
                    onClick={() => setSelectedIncident(inc)}
                  />
                );
              })}

              {hasIncident && ambulanceCoords && (
                <AmbulanceMarker
                  position={ambulanceCoords}
                  plateNumber="INBOUND AMBULANCE"
                  speed={52}
                  eta="6 mins"
                />
              )}

              {hasIncident && incidentCoords && ambulanceCoords && (
                <RoutePolyline
                  positions={[incidentCoords, ambulanceCoords, hospitalCoords]}
                  color="#EF4444"
                  dashArray="6, 6"
                />
              )}
            </MapContainer>

            {/* Radar Overlay Status */}
            <div className="absolute top-4 left-4 z-[400] px-3.5 py-2 rounded-xl bg-dark-950/85 backdrop-blur-md border border-dark-700 text-xs font-mono flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasIncident ? "bg-emergency-500 animate-ping" : "bg-emerald-400"
                }`}
              />
              <span className="font-bold text-white">
                {hasIncident ? "LIVE TELEMETRY INBOUND" : "FACILITY RADAR ACTIVE"}
              </span>
            </div>

            {/* Change Location Button on Map Overlay */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="absolute top-4 right-4 z-[400] px-3 py-1.5 rounded-xl bg-dark-950/85 backdrop-blur-md hover:bg-dark-900 border border-dark-700 text-[11px] font-mono font-bold text-cyan-300 flex items-center space-x-1.5 transition shadow-lg"
            >
              <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Update Hospital Location</span>
            </button>
          </div>

          {/* SPOTLIGHT CASE ADMISSION & BAY PREP DECK */}
          {selectedIncident ? (
            <div className="p-6 rounded-2xl bg-dark-900 border-2 border-dark-700 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emergency-400 uppercase">
                      ACTIVE TRAUMA TRIAGE
                    </span>
                    <PriorityBadge
                      priority={selectedIncident?.aiTriage?.priority || "CRITICAL"}
                    />
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Case #{selectedIncident._id.slice(-6).toUpperCase()} —{" "}
                    {selectedIncident.type || "Trauma Patient"}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={readyBay}
                    onChange={(e) => setReadyBay(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-dark-800 border border-dark-600 text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="Trauma Bay 1 (Red Zone)">Trauma Bay 1 (Red)</option>
                    <option value="Trauma Bay 2 (Red Zone)">Trauma Bay 2 (Red)</option>
                    <option value="OR-4 Surgical Suite">OR-4 Surgical Suite</option>
                    <option value="ICU Bed 07">ICU Bed 07</option>
                  </select>
                </div>
              </div>

              {/* Clinical AI Findings & Patient Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-dark-500 block text-[10px] uppercase">
                    AI Clinical Triage Summary
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed">
                    {selectedIncident?.aiTriage?.summary ||
                      "Suspected polytrauma with blunt thoracic impact. Immediate airway clearance and blood gas analysis indicated."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-dark-500 block text-[10px] uppercase">
                    Scene Address & Contact
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed">
                    {selectedIncident?.location?.address || "Dispatched Coordinates"}
                  </p>
                  {selectedIncident?.userContact && (
                    <span className="text-cyan-400 mt-1 block">
                      Reporting Bystander: {selectedIncident.userContact}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Accept / Bay Ready / Divert */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleAccept(selectedIncident._id)}
                  disabled={isAccepting}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {isAccepting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Patient</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleMarkReady(selectedIncident._id)}
                  disabled={isMarkingReady}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {isMarkingReady ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Bed className="w-4 h-4" />
                      <span>Mark Bay Ready</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDivert(selectedIncident._id)}
                  disabled={isDiverting}
                  className="py-3 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-emergency-500/50 text-emergency-400 font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Divert Call</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-dark-900 border border-dark-700 text-center text-xs text-dark-400 font-mono">
              Select an inbound trauma case from the radar queue to pre-allocate an ICU bay.
            </div>
          )}
        </div>
      </div>

      {/* HOSPITAL LOCATION PICKER MODAL */}
      <HospitalLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentHospital={hospital}
        onSuccess={refetch}
      />
    </div>
  );
};

export default HospitalDashboard;

