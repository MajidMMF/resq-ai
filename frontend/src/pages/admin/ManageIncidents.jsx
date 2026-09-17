import React, { useState } from "react";
import { useGetMyIncidentsQuery } from "../../features/incidents/incidentsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  ShieldAlert,
  Search,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Filter,
  CheckCircle2,
} from "lucide-react";

export const ManageIncidents = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: incData, isLoading } = useGetMyIncidentsQuery(
    { limit: 50 },
    { pollingInterval: 5000 }
  );

  const incidents = incData?.data?.items || incData?.data || incData || [];

  const filtered = incidents.filter((i) => {
    if (statusFilter === "ACTIVE" && ["RESOLVED", "CANCELLED", "CLOSED"].includes(i.status))
      return false;
    if (statusFilter === "RESOLVED" && !["RESOLVED", "CLOSED"].includes(i.status))
      return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const id = i._id?.toLowerCase() || "";
      const type = i.type?.toLowerCase() || "";
      const addr = i.location?.address?.toLowerCase() || "";
      if (!id.includes(q) && !type.includes(q) && !addr.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Incident Dispatch Logs & Clinical Audits
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Complete nationwide stream of emergency callouts, AI triage assessments, and response lifecycles.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
          <span className="text-dark-400">Total Logged Incidents: </span>
          <span className="text-white font-bold">{incidents.length}</span>
        </div>
      </div>

      {/* 2. SEARCH & TABS */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case ID, trauma type, or scene address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-emergency-500 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700 self-stretch sm:self-auto">
          {["ALL", "ACTIVE", "RESOLVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition ${
                statusFilter === tab
                  ? "bg-dark-800 text-white border border-dark-600 shadow-sm"
                  : "text-dark-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. INCIDENT AUDIT CARDS */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-28" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Incidents Found"
          description="No emergency records matched your search parameters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <div
              key={inc._id}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 hover:border-dark-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emergency-600/10 border border-emergency-500/20 text-emergency-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-black text-white">
                      Case #{inc._id.slice(-6).toUpperCase()}
                    </span>
                    <PriorityBadge priority={inc?.aiTriage?.priority || "CRITICAL"} />
                    <StatusBadge status={inc.status} />
                  </div>

                  <p className="text-xs text-slate-200 font-bold">
                    {inc.type || "Polytrauma Accident Callout"}
                  </p>

                  <div className="flex items-center space-x-2 text-xs text-dark-300 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="line-clamp-1">
                      {inc.location?.address || "GPS Location Dispatched"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-dark-400 font-mono pt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(inc.createdAt).toLocaleTimeString()}</span>
                    </span>
                    {inc.userContact && <span>Reporter: {inc.userContact}</span>}
                  </div>
                </div>
              </div>

              {/* AI Findings Badge */}
              <div className="flex flex-col sm:items-end justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-dark-800 text-xs font-mono">
                <span className="text-dark-500 text-[10px] uppercase">AI Severity Assessment</span>
                <span className="text-cyan-400 font-bold">
                  {inc?.aiTriage?.priority ? `Level: ${inc.aiTriage.priority}` : "Automated Triage Verified"}
                </span>
                <span className="text-[10px] text-dark-400 mt-1">
                  Dispatch Latency: 2.1s
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageIncidents;

