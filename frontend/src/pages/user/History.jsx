import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetMyIncidentsQuery } from "../../features/incidents/incidentsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import PriorityBadge from "../../components/shared/PriorityBadge";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import EmptyState from "../../components/shared/EmptyState";
import PageHeader from "../../components/shared/PageHeader";
import { Clock, MapPin, ChevronRight, Filter } from "lucide-react";
import { staggerChildren } from "../../lib/gsap";
import { useGsap } from "../../hooks/useGsap";

export const History = () => {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const user = useSelector((state) => state.auth.user);
  const userId = user?.userId || user?._id || user?.id;

  const { data: incidentsData, isLoading, refetch } = useGetMyIncidentsQuery(
    userId ? { userId } : undefined,
    {
      refetchOnMountOrArgChange: true,
      pollingInterval: 2500,
    }
  );

  const allIncidents = Array.isArray(incidentsData?.data)
    ? incidentsData.data
    : Array.isArray(incidentsData)
    ? incidentsData
    : [];

  const filteredIncidents = allIncidents.filter((inc) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "ACTIVE")
      return !["RESOLVED", "CANCELLED", "REJECTED"].includes(inc.status);
    if (statusFilter === "RESOLVED") return inc.status === "RESOLVED";
    if (statusFilter === "CANCELLED") return ["CANCELLED", "REJECTED"].includes(inc.status);
    return true;
  });

  useGsap(() => {
    if (listRef.current) {
      staggerChildren(listRef.current, 0.05);
    }
  }, [filteredIncidents.length, statusFilter]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Incident History"
        subtitle="Complete archive of emergency reports and medical dispatches."
        action={
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700">
            {["ALL", "ACTIVE", "RESOLVED", "CANCELLED"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === f
                    ? "bg-dark-700 text-cyan-400 shadow-sm"
                    : "text-dark-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No incidents matching filter"
          description="Try changing the filter or return to all recorded events."
          actionLabel="Report New Incident"
          onAction={() => navigate("/report")}
        />
      ) : (
        <div ref={listRef} className="space-y-3">
          {filteredIncidents.map((inc) => (
            <div
              key={inc._id}
              onClick={() => navigate(`/emergency/${inc._id}`)}
              className="p-5 rounded-2xl bg-dark-900/80 hover:bg-dark-800 border border-dark-700/80 hover:border-dark-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-lg"
            >
              <div className="flex items-start space-x-3.5 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
                      {inc.type || inc.description || "Emergency Incident"}
                    </h4>
                    <span className="text-[10px] text-dark-500 font-mono">
                      #{inc._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  {inc.location?.address && (
                    <p className="text-[11px] text-dark-300 font-mono mt-0.5 line-clamp-1">
                      📍 {inc.location.address}
                    </p>
                  )}
                  <p className="text-xs text-dark-400 mt-1 font-mono">
                    {new Date(inc.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                <StatusBadge status={inc.status} />
                <PriorityBadge priority={inc.priority || "MEDIUM"} />
                <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

