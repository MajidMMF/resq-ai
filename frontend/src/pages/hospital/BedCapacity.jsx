import React, { useState, useEffect } from "react";
import {
  useGetMyHospitalQuery,
  useUpdateHospitalCapabilityMutation,
} from "../../features/hospitals/hospitalsApi";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Bed,
  HeartPulse,
  Wind,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";

export const BedCapacity = () => {
  const { data: hospitalData, isLoading, refetch } = useGetMyHospitalQuery();
  const [updateCapability, { isLoading: isUpdating }] = useUpdateHospitalCapabilityMutation();

  const hospital = hospitalData?.data?.hospital || hospitalData?.hospital || hospitalData?.data || {};
  const capability = hospitalData?.data?.capability || hospital?.capability || {};

  // Local editable capacity counters
  const [beds, setBeds] = useState(24);
  const [icu, setIcu] = useState(6);
  const [ventilators, setVentilators] = useState(4);
  const [traumaReady, setTraumaReady] = useState(true);

  useEffect(() => {
    if (capability) {
      if (capability.beds !== undefined && capability.beds !== null) setBeds(capability.beds);
      if (capability.icu !== undefined && capability.icu !== null) setIcu(capability.icu);
      if (capability.ventilators !== undefined && capability.ventilators !== null)
        setVentilators(capability.ventilators);
      if (capability.trauma !== undefined && capability.trauma !== null)
        setTraumaReady(capability.trauma);
    }
  }, [capability]);

  const handleSave = async () => {
    try {
      await updateCapability({
        beds: Number(beds),
        icu: Number(icu),
        ventilators: Number(ventilators),
        trauma: Boolean(traumaReady),
      }).unwrap();
      toast.success("Hospital live bed & trauma capacity broadcasted to ResQ Dispatch Grid!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to update bed capacity");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={3} className="h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>ER & ICU Bed Management</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              LIVE BROADCAST
            </span>
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Real-time capacity counters dictate which emergency ambulances and AI triage cases are routed to this facility.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emergency-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Broadcasting...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Broadcast Changes</span>
            </>
          )}
        </button>
      </div>

      {/* 2. LIVE CAPACITY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: General ER Emergency Bays */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bed className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                General ER Bays
              </h2>
            </div>
            <span className="text-xs font-mono text-dark-400">Available</span>
          </div>

          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => setBeds(Math.max(0, beds - 1))}
              className="w-10 h-10 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white flex items-center justify-center transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-4xl font-black text-white font-mono">{beds}</span>
            <button
              onClick={() => setBeds(beds + 1)}
              className="w-10 h-10 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white flex items-center justify-center transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-dark-400 font-mono">
            Standard acute care resuscitation and triage observation beds.
          </p>
        </div>

        {/* Card 2: Intensive Care Unit (ICU) */}
        <div className="p-6 rounded-2xl bg-dark-900 border-2 border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                Critical ICU Beds
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">Priority</span>
          </div>

          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => setIcu(Math.max(0, icu - 1))}
              className="w-10 h-10 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white flex items-center justify-center transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-4xl font-black text-emerald-400 font-mono">{icu}</span>
            <button
              onClick={() => setIcu(icu + 1)}
              className="w-10 h-10 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white flex items-center justify-center transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-dark-400 font-mono">
            Equipped for Level 1 invasive hemodynamic monitoring and central line care.
          </p>
        </div>

        {/* Card 3: Mechanical Ventilators */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Wind className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                Ventilators
              </h2>
            </div>
            <span className="text-xs font-mono text-dark-400">Free Units</span>
          </div>

          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => setVentilators(Math.max(0, ventilators - 1))}
              className="w-10 h-10 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white flex items-center justify-center transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-4xl font-black text-purple-400 font-mono">{ventilators}</span>
            <button
              onClick={() => setVentilators(ventilators + 1)}
              className="w-10 h-10 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white flex items-center justify-center transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-dark-400 font-mono">
            High-flow invasive ventilators calibrated and sterilized on standby.
          </p>
        </div>
      </div>

      {/* 3. TRAUMA READINESS TOGGLE & PROTOCOL */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emergency-600/15 border border-emergency-500/30 flex items-center justify-center text-emergency-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Trauma Team Standby Status</h3>
            <p className="text-xs text-dark-300 mt-0.5">
              When enabled, AI dispatch algorithms prioritize this hospital for polytrauma and severe collision rescues.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setTraumaReady(!traumaReady)}
          className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition border flex items-center space-x-2 ${
            traumaReady
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-dark-800 border-dark-600 text-dark-400 hover:text-white"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{traumaReady ? "Trauma Team Ready" : "Trauma Standby Disabled"}</span>
        </button>
      </div>
    </div>
  );
};

export default BedCapacity;

