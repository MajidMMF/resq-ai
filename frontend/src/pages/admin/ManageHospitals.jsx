import React, { useState } from "react";
import {
  useListAllHospitalsQuery,
  useApproveHospitalMutation,
  useSuspendHospitalMutation,
} from "../../features/hospitals/hospitalsApi";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Hospital,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  Building,
} from "lucide-react";
import { toast } from "sonner";

export const ManageHospitals = () => {
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, APPROVED
  const [search, setSearch] = useState("");

  const { data: hospData, isLoading, refetch } = useListAllHospitalsQuery(undefined, {
    pollingInterval: 6000,
  });

  const [approveHospital, { isLoading: isApproving }] = useApproveHospitalMutation();
  const [suspendHospital, { isLoading: isSuspending }] = useSuspendHospitalMutation();

  const hospitals = hospData?.data || hospData || [];

  const handleApprove = async (id) => {
    try {
      await approveHospital(id).unwrap();
      toast.success("Hospital facility accredited into ResQ Network!");
      refetch();
    } catch {
      toast.error("Failed to approve hospital");
    }
  };

  const handleSuspend = async (id) => {
    try {
      await suspendHospital(id).unwrap();
      toast.warning("Hospital facility suspended from emergency dispatch pool");
      refetch();
    } catch {
      toast.error("Failed to suspend hospital");
    }
  };

  const filtered = hospitals.filter((h) => {
    if (filter === "PENDING" && h.isApproved) return false;
    if (filter === "APPROVED" && !h.isApproved) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const name = h.name?.toLowerCase() || "";
      const address = h.address?.toLowerCase() || "";
      if (!name.includes(q) && !address.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Trauma Center & Hospital Registry
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Authorize regional trauma centers, verify emergency ER capability, and manage diversion protocols.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
            <span className="text-dark-400">Total Facilities: </span>
            <span className="text-white font-bold">{hospitals.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono">
            <span className="text-dark-400">Accredited: </span>
            <span className="text-emerald-400 font-bold">
              {hospitals.filter((h) => h.isApproved).length}
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
            placeholder="Search by facility name, address, or trauma level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700 self-stretch sm:self-auto">
          {["ALL", "PENDING", "APPROVED"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
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

      {/* 3. HOSPITALS LIST */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-24" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Hospital}
          title="No Hospital Facilities Found"
          description="No healthcare centers matched your current search filters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((hosp) => (
            <div
              key={hosp._id}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-700/80 hover:border-dark-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl">
                  🏥
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-black text-white">
                      {hosp.name || "Regional Trauma Hospital"}
                    </span>
                    {hosp.isApproved ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        ACCREDITED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        ACCREDITATION PENDING
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-dark-300 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{hosp.address || "Medical District, City Center"}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-dark-400 font-mono">
                    {hosp.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>Hotline: {hosp.phone}</span>
                      </span>
                    )}
                    <span>Trauma Level: 1 (Apex Resuscitation)</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-dark-800">
                {!hosp.isApproved ? (
                  <button
                    onClick={() => handleApprove(hosp._id)}
                    disabled={isApproving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accredit Facility</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspend(hosp._id)}
                    disabled={isSuspending}
                    className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-emergency-400 border border-dark-600 hover:border-emergency-500/40 font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Suspend Grid Link</span>
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

export default ManageHospitals;

