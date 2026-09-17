import React, { useState } from "react";
import {
  useListAllAmbulancesQuery,
  useApproveAmbulanceMutation,
  useSuspendAmbulanceMutation,
} from "../../features/ambulances/ambulancesApi";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const ManageAmbulances = () => {
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, APPROVED, ONLINE
  const [search, setSearch] = useState("");

  const { data: ambData, isLoading, refetch } = useListAllAmbulancesQuery(undefined, {
    pollingInterval: 6000,
  });

  const [approveAmbulance, { isLoading: isApproving }] = useApproveAmbulanceMutation();
  const [suspendAmbulance, { isLoading: isSuspending }] = useSuspendAmbulanceMutation();

  const ambulances = ambData?.data || ambData || [];

  const handleApprove = async (id) => {
    try {
      await approveAmbulance(id).unwrap();
      toast.success("Ambulance approved for active emergency dispatch grid!");
      refetch();
    } catch {
      toast.error("Failed to approve ambulance");
    }
  };

  const handleSuspend = async (id) => {
    try {
      await suspendAmbulance(id).unwrap();
      toast.warning("Ambulance suspended and forced offline");
      refetch();
    } catch {
      toast.error("Failed to suspend ambulance");
    }
  };

  const filtered = ambulances.filter((a) => {
    if (filter === "PENDING" && a.isApproved) return false;
    if (filter === "APPROVED" && !a.isApproved) return false;
    if (filter === "ONLINE" && a.status !== "online") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const plate = a.plateNumber?.toLowerCase() || "";
      const type = a.type?.toLowerCase() || "";
      if (!plate.includes(q) && !type.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Ambulance Fleet Approvals & Registry
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Authorize new emergency response units, monitor paramedic telemetry, and enforce fleet compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
            <span className="text-dark-400">Total Units: </span>
            <span className="text-white font-bold">{ambulances.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
            <span className="text-dark-400">Approved: </span>
            <span className="text-emerald-400 font-bold">
              {ambulances.filter((a) => a.isApproved).length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by license plate number, vehicle tier (ALS/BLS)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700 self-stretch sm:self-auto overflow-x-auto">
          {["ALL", "PENDING", "APPROVED", "ONLINE"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                filter === t
                  ? "bg-dark-800 text-white border border-dark-600 shadow-sm"
                  : "text-dark-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. FLEET LIST */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-24" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Ambulances Found"
          description="No fleet units matched your current filter criteria."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((amb) => (
            <div
              key={amb._id}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 hover:border-dark-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-black text-white">
                      {amb.plateNumber || "DL 01 AM 9042"}
                    </span>
                    <StatusBadge status={amb.status} />
                    {amb.isApproved ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        APPROVED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        APPROVAL PENDING
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-dark-300 font-mono">
                    Tier: <span className="text-white font-semibold">{amb.type || "ALS Level 3"}</span>{" "}
                    • Base:{" "}
                    <span className="text-cyan-400">
                      {amb.hospitalId ? "Linked Hospital" : "Central Standby Pool"}
                    </span>
                  </p>

                  <div className="text-[11px] text-dark-400 font-mono">
                    Registered: {new Date(amb.createdAt).toLocaleDateString()} • GPS: Active
                  </div>
                </div>
              </div>

              {/* Approval Actions */}
              <div className="flex items-center space-x-2.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-dark-800">
                {!amb.isApproved ? (
                  <button
                    onClick={() => handleApprove(amb._id)}
                    disabled={isApproving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Unit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspend(amb._id)}
                    disabled={isSuspending}
                    className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-emergency-400 border border-dark-600 hover:border-emergency-500/40 font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Suspend Unit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageAmbulances;

