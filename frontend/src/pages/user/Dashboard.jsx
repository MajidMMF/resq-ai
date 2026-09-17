import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Flame,
  Car,
  HeartPulse,
  UserX,
  ChevronRight,
  ShieldCheck,
  Clock,
  MapPin,
  Navigation,
  Crosshair,
} from "lucide-react";
import { useGetMyIncidentsQuery } from "../../features/incidents/incidentsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import MapContainer from "../../components/maps/MapContainer";
import UserMarker from "../../components/maps/UserMarker";
import useReverseGeocode from "../../hooks/useReverseGeocode";
import FlipNumber from "../../components/shared/FlipNumber";
import { staggerChildren } from "../../lib/gsap";
import { useGsap } from "../../hooks/useGsap";

const QUICK_TYPES = [
  { id: "ROAD_ACCIDENT", label: "Car Crash", icon: Car, color: "text-emergency-400" },
  { id: "PEDESTRIAN_HIT", label: "Pedestrian", icon: UserX, color: "text-warning-400" },
  { id: "FIRE_OUTBREAK", label: "Fire / Burns", icon: Flame, color: "text-emergency-500" },
  { id: "MEDICAL_EMERGENCY", label: "Heart / Medical", icon: HeartPulse, color: "text-cyan-400" },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: incidentsData, isLoading } = useGetMyIncidentsQuery({ limit: 10 });

  // Citizen Live Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Reverse geocoded place name for citizen location
  const { placeName, address: fullAddress, loading: placeLoading } = useReverseGeocode(
    userLocation?.lat,
    userLocation?.lng
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocationLoading(false);
        setLocationError(null);
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message);
        setLocationError(err.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const incidents = incidentsData?.data || [];
  const activeIncident = incidents.find((inc) =>
    ["REPORTED", "ANALYZING", "TRIAGED", "DISPATCHED", "EN_ROUTE", "ARRIVED"].includes(inc.status)
  );

  const stats = {
    total: incidents.length,
    active: incidents.filter((i) => !["RESOLVED", "CANCELLED"].includes(i.status)).length,
    resolved: incidents.filter((i) => i.status === "RESOLVED").length,
  };

  const quickActionsRef = React.useRef(null);
  const statsGridRef = React.useRef(null);
  const incidentsListRef = React.useRef(null);

  useGsap(() => {
    if (quickActionsRef.current) {
      staggerChildren(quickActionsRef.current, 0.08);
    }
    if (statsGridRef.current) {
      staggerChildren(statsGridRef.current, 0.1);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && incidentsListRef.current && incidents.length > 0) {
      staggerChildren(incidentsListRef.current, 0.06);
    }
  }, [isLoading, incidents.length]);

  return (
    <div className="space-y-6">
      {/* 1. HERO EMERGENCY CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 via-dark-800 to-emergency-950/40 border border-emergency-500/30 p-6 sm:p-8 shadow-2xl shadow-emergency-950/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emergency-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emergency-500/20 border border-emergency-500/40 text-emergency-400 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emergency-500 animate-ping" />
              <span>Immediate EMS Dispatch Available</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Facing An Emergency?
            </h1>
            <p className="text-xs sm:text-sm text-dark-300 mt-1 max-w-xl">
              Report an accident in 30 seconds. ResQ AI dispatches the nearest advanced
              ambulance and alerts nearby trauma centers instantly.
            </p>
          </div>

          <Link
            to="/report"
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-600 text-white font-extrabold text-sm tracking-wide uppercase shadow-xl shadow-emergency-600/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 shrink-0"
          >
            <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            <span>Report Accident Now</span>
          </Link>
        </div>

        {/* 4 Quick Type Shortcuts */}
        <div ref={quickActionsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-dark-700/60">
          {QUICK_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => navigate(`/report?type=${type.id}`)}
                className="flex items-center space-x-3 p-3 rounded-xl bg-dark-900/80 hover:bg-dark-700/90 border border-dark-700/70 hover:border-dark-500 transition group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">
                    {type.label}
                  </span>
                  <span className="text-[10px] text-dark-400 block font-mono">1-tap report</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE RESCUE BANNER (If Active Incident exists) */}
      {activeIncident && (
        <div className="p-5 rounded-2xl bg-dark-900 border border-cyan-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-dark-700">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  ACTIVE RESCUE IN PROGRESS • #{activeIncident._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {activeIncident.description || "Emergency Incident Reported"}
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <StatusBadge status={activeIncident.status} />
              <PriorityBadge priority={activeIncident.priority || "HIGH"} />
              <Link
                to={`/emergency/${activeIncident._id}`}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95"
              >
                Track Live Rescue &rarr;
              </Link>
            </div>
          </div>

          {/* Mini Leaflet Preview */}
          {activeIncident.location?.coordinates && (
            <div className="mt-4 h-48 rounded-xl overflow-hidden border border-dark-700">
              <MapContainer
                center={[
                  activeIncident.location.coordinates[1],
                  activeIncident.location.coordinates[0],
                ]}
                zoom={14}
              >
                <UserMarker
                  position={[
                    activeIncident.location.coordinates[1],
                    activeIncident.location.coordinates[0],
                  ]}
                  label="Emergency Location"
                />
              </MapContainer>
            </div>
          )}
        </div>
      )}

      {/* 3. CITIZEN LIVE LOCATION MAP */}
      <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-700/80 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  {placeLoading ? (
                    <span className="animate-pulse text-dark-300">Resolving location name...</span>
                  ) : placeName ? (
                    <span>{placeName}</span>
                  ) : (
                    <span>Your Current Live Location</span>
                  )}
                </span>
                {userLocation && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                    GPS Locked (±{userLocation.accuracy}m)
                  </span>
                )}
              </div>
              <p className="text-xs text-dark-400 mt-0.5">
                {fullAddress ? (
                  <span className="truncate max-w-lg inline-block" title={fullAddress}>
                    {fullAddress}
                  </span>
                ) : userLocation ? (
                  `GPS Coordinates: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                ) : locationLoading ? (
                  "Acquiring GPS location from device..."
                ) : locationError ? (
                  `Location unavailable: ${locationError}`
                ) : (
                  "Location not available"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setLocationLoading(true);
                navigator.geolocation?.getCurrentPosition(
                  (pos) => {
                    setUserLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                      accuracy: Math.round(pos.coords.accuracy),
                    });
                    setLocationLoading(false);
                    setLocationError(null);
                  },
                  (err) => {
                    setLocationError(err.message);
                    setLocationLoading(false);
                  },
                  { enableHighAccuracy: true }
                );
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 hover:text-white text-xs font-medium transition"
              title="Refresh GPS coordinates"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>Locate Me</span>
            </button>
            <Link
              to="/report"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emergency-600 hover:bg-emergency-500 text-white text-xs font-bold transition shadow-md shadow-emergency-600/20"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Report at Location</span>
            </Link>
          </div>
        </div>

        {/* Map Container */}
        <div className="mt-4 h-64 sm:h-72 rounded-xl overflow-hidden border border-dark-700/80 relative">
          {userLocation ? (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={15}
            >
              <UserMarker
                position={[userLocation.lat, userLocation.lng]}
                label="You Are Here (Live Citizen Location)"
              />
            </MapContainer>
          ) : locationLoading ? (
            <div className="w-full h-full bg-dark-800/60 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span className="text-xs text-dark-300 font-mono">Fetching device GPS coordinates...</span>
            </div>
          ) : (
            <div className="w-full h-full bg-dark-800/60 flex flex-col items-center justify-center space-y-2 p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-warning-400" />
              <p className="text-xs text-dark-300 font-medium">
                {locationError || "Location access was denied or is unavailable."}
              </p>
              <p className="text-[11px] text-dark-500 max-w-sm">
                Please allow browser or device location permission so responders can pinpoint your location in an emergency.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. STATISTICS STRIP */}
      <div ref={statsGridRef} className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/70">
          <p className="text-[10px] sm:text-xs font-mono uppercase text-dark-400">Total Reported</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            <FlipNumber value={stats.total} />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/70">
          <p className="text-[10px] sm:text-xs font-mono uppercase text-dark-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-500 animate-pulse" />
            Active Cases
          </p>
          <p className="text-xl sm:text-2xl font-black text-emergency-400 mt-1 font-mono">
            <FlipNumber value={stats.active} />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/70">
          <p className="text-[10px] sm:text-xs font-mono uppercase text-dark-400">Resolved</p>
          <p className="text-xl sm:text-2xl font-black text-success-400 mt-1 font-mono">
            <FlipNumber value={stats.resolved} />
          </p>
        </div>
      </div>

      {/* 4. RECENT INCIDENTS LIST */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-dark-400" />
            <span>Recent Emergency Incidents</span>
          </h2>
          <Link to="/history" className="text-xs text-cyan-400 hover:underline font-medium">
            View All History &rarr;
          </Link>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : incidents.length === 0 ? (
          <EmptyState
            title="No emergency incidents"
            description="You have not reported any incidents yet. The emergency button is always ready when needed."
            actionLabel="Report Accident"
            onAction={() => navigate("/report")}
          />
        ) : (
          <div ref={incidentsListRef} className="space-y-2.5">
            {incidents.slice(0, 5).map((inc) => (
              <div
                key={inc._id}
                onClick={() => navigate(`/emergency/${inc._id}`)}
                className="p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-dark-700/60 hover:border-dark-600 transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center shrink-0 group-hover:bg-dark-600 transition">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition">
                      {inc.description || "Emergency Callout"}
                    </p>
                    <p className="text-[10px] text-dark-400 font-mono mt-0.5">
                      {new Date(inc.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <StatusBadge status={inc.status} />
                  <PriorityBadge priority={inc.priority || "MEDIUM"} />
                  <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

