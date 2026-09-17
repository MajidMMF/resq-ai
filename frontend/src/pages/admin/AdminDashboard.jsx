import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useListAllAmbulancesQuery } from "../../features/ambulances/ambulancesApi";
import { useListAllHospitalsQuery } from "../../features/hospitals/hospitalsApi";
import { useGetMyIncidentsQuery } from "../../features/incidents/incidentsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import MapContainer from "../../components/maps/MapContainer";
import AmbulanceMarker from "../../components/maps/AmbulanceMarker";
import HospitalMarker from "../../components/maps/HospitalMarker";
import UserMarker from "../../components/maps/UserMarker";
import {
  ShieldAlert,
  Truck,
  Hospital,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Radio,
  Server,
  Users,
  Compass,
} from "lucide-react";

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // Polling operational data every 5s
  const { data: ambData, isLoading: isLoadingAmb } = useListAllAmbulancesQuery(undefined, {
    pollingInterval: 5000,
  });
  const { data: hospData, isLoading: isLoadingHosp } = useListAllHospitalsQuery(undefined, {
    pollingInterval: 5000,
  });
  const { data: incData, isLoading: isLoadingInc } = useGetMyIncidentsQuery(
    { limit: 10 },
    { pollingInterval: 5000 }
  );

  const ambulances = ambData?.data || ambData || [];
  const hospitals = hospData?.data || hospData || [];
  const incidents = incData?.data?.items || incData?.data || incData || [];

  // Metrics
  const onlineAmb = ambulances.filter((a) => a.status === "online").length;
  const busyAmb = ambulances.filter((a) => a.status === "busy").length;
  const pendingAmb = ambulances.filter((a) => !a.isApproved).length;

  const activeHosp = hospitals.filter((h) => h.isActive !== false).length;
  const pendingHosp = hospitals.filter((h) => !h.isApproved).length;

  const activeIncidents = incidents.filter((i) => !["RESOLVED", "CANCELLED", "CLOSED"].includes(i.status));

  // Map center (Delhi NCR core)
  const mapCenter = [28.6139, 77.209];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP OPERATIONAL STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-dark-400">
              Active Callouts
            </span>
            <div className="w-8 h-8 rounded-lg bg-emergency-500/10 text-emergency-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-white font-mono block">
            {activeIncidents.length}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 block">
            AI Triage Latency: 1.8s
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-dark-400">
              Ambulance Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-white font-mono block">
            {onlineAmb + busyAmb}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 block">
            {onlineAmb} Online • {busyAmb} In-Mission
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-dark-400">
              Hospital Grid
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Hospital className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-white font-mono block">
            {activeHosp}
          </span>
          <span className="text-[10px] font-mono text-purple-400 block">
            {hospitals.length} Total Facilities
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-dark-400">
              Approvals Pending
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-amber-400 font-mono block">
            {pendingAmb + pendingHosp}
          </span>
          <span className="text-[10px] font-mono text-dark-400 block">
            {pendingAmb} Fleet • {pendingHosp} Facilities
          </span>
        </div>
      </div>

      {/* 2. LIVE CITY-WIDE INCIDENT & FLEET RADAR MAP */}
      <div className="p-6 rounded-3xl bg-dark-900 border border-dark-700 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                National Operations Live Geospatial Grid
              </h2>
            </div>
            <p className="text-xs text-dark-400 mt-0.5">
              Live coordinates of active emergency incidents, dispatched ambulances, and ready trauma hospitals.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-700 text-cyan-400 font-bold">
              Ambulances: {ambulances.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-dark-950 border border-dark-700 text-emerald-400 font-bold">
              Hospitals: {hospitals.length}
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="h-[420px] rounded-2xl overflow-hidden border border-dark-700 relative">
          <MapContainer center={mapCenter} zoom={12} className="w-full h-full">
            {/* Ambulances */}
            {ambulances.map((amb) => {
              if (!amb.location?.coordinates) return null;
              const pos = [amb.location.coordinates[1], amb.location.coordinates[0]];
              return (
                <AmbulanceMarker
                  key={amb._id}
                  position={pos}
                  plateNumber={amb.plateNumber}
                  speed={amb.status === "busy" ? 54 : 0}
                />
              );
            })}

            {/* Hospitals */}
            {hospitals.map((hosp) => {
              if (!hosp.location?.coordinates) return null;
              const pos = [hosp.location.coordinates[1], hosp.location.coordinates[0]];
              return (
                <HospitalMarker
                  key={hosp._id}
                  position={pos}
                  name={hosp.name}
                  traumaLevel="LEVEL_1"
                  bedsAvailable={4}
                />
              );
            })}

            {/* Incidents */}
            {incidents.map((inc) => {
              if (!inc.location?.coordinates) return null;
              const pos = [inc.location.coordinates[1], inc.location.coordinates[0]];
              return (
                <UserMarker
                  key={inc._id}
                  position={pos}
                  label={`Incident #${inc._id.slice(-6).toUpperCase()}`}
                />
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* 3. DUAL QUICK ACTION PANELS: FLEET APPROVALS & RECENT EMERGENCIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Verification Queue */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Fleet Verification Queue
              </h3>
            </div>
            <Link
              to="/admin/ambulances"
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              Manage All →
            </Link>
          </div>

          <div className="space-y-3">
            {ambulances.slice(0, 4).map((amb) => (
              <div
                key={amb._id}
                className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">
                    {amb.plateNumber} ({amb.type})
                  </span>
                  <span className="text-[10px] text-dark-400 font-mono">
                    Base: {amb.hospitalId ? "Linked Hospital" : "Standby Hub"}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status={amb.status} />
                  {amb.isApproved ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                      Approved
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Incident Dispatch Log */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-emergency-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Live Incident Dispatch Stream
              </h3>
            </div>
            <Link
              to="/admin/incidents"
              className="text-xs text-emergency-400 hover:underline font-mono"
            >
              Audit Log →
            </Link>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 4).map((inc) => (
              <div
                key={inc._id}
                className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      #{inc._id.slice(-6).toUpperCase()}
                    </span>
                    <PriorityBadge priority={inc?.aiTriage?.priority || "CRITICAL"} />
                  </div>
                  <span className="text-[10px] text-dark-400 font-mono line-clamp-1 mt-0.5">
                    {inc.location?.address || "Coordinates Dispatched"}
                  </span>
                </div>

                <StatusBadge status={inc.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

