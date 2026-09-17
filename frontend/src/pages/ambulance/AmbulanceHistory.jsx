import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetMyAssignmentsQuery } from "../../features/ambulances/ambulancesApi";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export const AmbulanceHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ALL"); // ALL, COMPLETED, REJECTED, ACTIVE
  const [searchQuery, setSearchQuery] = useState("");

  const { data: assignmentsData, isLoading } = useGetMyAssignmentsQuery();
  const assignments = assignmentsData?.data || assignmentsData || [];

  const filteredRuns = assignments.filter((run) => {
    // Status filter
    if (filter === "COMPLETED" && run.status !== "COMPLETED") return false;
    if (filter === "REJECTED" && run.status !== "REJECTED") return false;
    if (filter === "ACTIVE" && ["COMPLETED", "REJECTED", "CANCELLED"].includes(run.status))
      return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const incId = run.incidentId?.toString().toLowerCase() || "";
      const runId = run._id.toLowerCase();
      if (!incId.includes(q) && !runId.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mission History</h1>
          <p className="text-xs text-dark-400 mt-1">
            Complete record of dispatched emergency responses and completed patient runs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
            <span className="text-dark-400">Total Runs: </span>
            <span className="text-white font-bold">{assignments.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
            <span className="text-dark-400">Completed: </span>
            <span className="text-emerald-400 font-bold">
              {assignments.filter((a) => a.status === "COMPLETED").length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Run ID or Incident ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700 self-stretch sm:self-auto overflow-x-auto">
          {["ALL", "ACTIVE", "COMPLETED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                filter === tab
                  ? "bg-dark-800 text-white shadow-sm border border-dark-600"
                  : "text-dark-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. RUNS LIST */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-24" />
      ) : filteredRuns.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No dispatches found"
          description={
            searchQuery
              ? "No emergency runs matched your search filters."
              : "Completed and past runs will appear here as your unit responds to calls."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run) => (
            <div
              key={run._id}
              onClick={() => navigate(`/ambulance/run/${run._id}`)}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 hover:border-dark-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    run.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : run.status === "REJECTED"
                      ? "bg-emergency-500/10 text-emergency-400 border border-emergency-500/20"
                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  }`}
                >
                  {run.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : run.status === "REJECTED" ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
                      Run #{run._id.slice(-6).toUpperCase()}
                    </span>
                    <StatusBadge status={run.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark-400 font-mono">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(run.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(run.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <span>
                      Incident: #{run.incidentId?.toString().slice(-6).toUpperCase() || "N/A"}
                    </span>
                  </div>

                  {run.rejectionReason && (
                    <p className="text-xs text-emergency-400 font-mono mt-1">
                      Reason: {run.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-dark-800">
                <span className="text-xs font-mono font-bold text-dark-400 group-hover:text-white transition flex items-center space-x-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmbulanceHistory;

