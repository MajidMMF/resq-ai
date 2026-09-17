import React, { useState } from "react";
import {
  useGetHospitalPatientHistoryQuery,
  useGetActiveHospitalPatientsQuery,
} from "../../features/hospitals/hospitalsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  History,
  Calendar,
  Clock,
  User,
  Search,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";

export const PatientHistory = () => {
  const [tab, setTab] = useState("HISTORY"); // ACTIVE or HISTORY
  const [searchTerm, setSearchTerm] = useState("");

  const { data: historyData, isLoading: isLoadingHistory } = useGetHospitalPatientHistoryQuery();
  const { data: activeData, isLoading: isLoadingActive } = useGetActiveHospitalPatientsQuery();

  const historyList = historyData?.data || historyData || [];
  const activeList = activeData?.data || activeData || [];

  const displayedList = tab === "ACTIVE" ? activeList : historyList;
  const isLoading = tab === "ACTIVE" ? isLoadingActive : isLoadingHistory;

  const filteredList = displayedList.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const id = item._id?.toLowerCase() || "";
    const type = item.type?.toLowerCase() || "";
    const address = item.location?.address?.toLowerCase() || "";
    return id.includes(term) || type.includes(term) || address.includes(term);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Patient Admission Records
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Complete trauma admission records, emergency bay handovers, and discharge logs.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700">
          <button
            onClick={() => setTab("ACTIVE")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition ${
              tab === "ACTIVE"
                ? "bg-dark-800 text-white border border-dark-600 shadow-sm"
                : "text-dark-400 hover:text-white"
            }`}
          >
            In-Treatment ({activeList.length})
          </button>
          <button
            onClick={() => setTab("HISTORY")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition ${
              tab === "HISTORY"
                ? "bg-dark-800 text-white border border-dark-600 shadow-sm"
                : "text-dark-400 hover:text-white"
            }`}
          >
            Discharged & Resolved ({historyList.length})
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by incident ID, injury type, location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-emergency-500 transition"
        />
      </div>

      {/* 3. PATIENTS TABLE / CARDS */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-24" />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Patient Records Found"
          description={
            searchTerm
              ? "No records matched your search query."
              : "Completed trauma triage and admitted patients will be archived here."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 hover:border-dark-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      Case #{item._id.slice(-6).toUpperCase()}
                    </span>
                    <PriorityBadge priority={item?.aiTriage?.priority || "HIGH"} />
                    <StatusBadge status={item.status} />
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {item.type || "Trauma Incident"}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-dark-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </span>
                    <span>Scene: {item.location?.address || "GPS Coordinates"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-dark-800">
                {item?.allocatedBed && (
                  <span className="px-3 py-1.5 rounded-lg bg-dark-800 text-cyan-400 border border-dark-700 text-xs font-mono font-bold">
                    {item.allocatedBed}
                  </span>
                )}
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;

