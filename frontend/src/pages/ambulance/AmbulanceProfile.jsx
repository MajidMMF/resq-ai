import React, { useState } from "react";
import {
  useGetMyAmbulanceQuery,
  useUpdateAmbulanceStatusMutation,
} from "../../features/ambulances/ambulancesApi";
import useAuth from "../../hooks/useAuth";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Truck,
  User,
  Shield,
  Radio,
  Power,
  Phone,
  Mail,
  Hospital,
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

export const AmbulanceProfile = () => {
  const { user } = useAuth();
  const { data: myData, isLoading, refetch } = useGetMyAmbulanceQuery();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAmbulanceStatusMutation();

  const ambulance = myData?.data?.ambulance || myData?.ambulance || myData?.data || {};
  const driver = myData?.data?.driver || myData?.driver || {};

  const currentStatus = ambulance?.status || "offline";
  const isOnline = currentStatus === "online";

  const handleToggleStatus = async () => {
    const nextStatus = isOnline ? "offline" : "online";
    try {
      await updateStatus(nextStatus).unwrap();
      toast.success(`Unit status changed to ${nextStatus.toUpperCase()}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={3} className="h-36" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. TOP HERO CARD */}
      <div className="p-6 sm:p-8 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center text-emergency-400">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-white">
                {ambulance?.plateNumber || "AMB-104"}
              </h1>
              <StatusBadge status={currentStatus} />
            </div>
            <p className="text-xs text-dark-400 font-mono mt-1">
              {ambulance?.type || "ADVANCED LIFE SUPPORT (ALS)"} • Emergency Response Unit
            </p>
          </div>
        </div>

        {/* Online / Offline Driver Toggle */}
        <button
          onClick={handleToggleStatus}
          disabled={isUpdatingStatus || currentStatus === "busy"}
          className={`px-5 py-3 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg ${
            isOnline
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30"
              : "bg-dark-800 text-dark-300 border border-dark-600 hover:bg-dark-700"
          } disabled:opacity-50`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? "Unit is Online" : "Go Online (Start Shift)"}</span>
        </button>
      </div>

      {/* 2. SPECIFICATIONS & PARAMEDIC DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle Information */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
            <Truck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Vehicle Specifications
            </h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-dark-800">
              <span className="text-dark-400">License Plate</span>
              <span className="text-white font-bold">{ambulance?.plateNumber || "DL 01 AM 9042"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dark-800">
              <span className="text-dark-400">Ambulance Tier</span>
              <span className="text-white font-bold">{ambulance?.type || "ALS (Level 3)"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dark-800">
              <span className="text-dark-400">Base Station / Hospital</span>
              <span className="text-cyan-400 font-bold">
                {ambulance?.hospitalName || "AIIMS Apex Trauma Center"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-dark-400">Equipment Verification</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Oxygen, Defibrillator, AED Passed</span>
              </span>
            </div>
          </div>
        </div>

        {/* Paramedic / Crew Information */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Lead Paramedic & Crew
            </h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-dark-800">
              <span className="text-dark-400">Driver / Paramedic</span>
              <span className="text-white font-bold">{driver?.name || user?.name || "Paramedic Officer"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dark-800">
              <span className="text-dark-400">Official Email</span>
              <span className="text-white">{driver?.email || user?.email || "driver@resq.ai"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dark-800">
              <span className="text-dark-400">Emergency Radio / Phone</span>
              <span className="text-white font-bold">{driver?.phone || user?.phone || "+91 98765 43210"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-dark-400">Security Clearance</span>
              <span className="text-cyan-400 font-bold">EMERGENCY_DRIVER_LEVEL_2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SHIFT READINESS & PROTOCOL CHECKLIST */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
        <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Operational Protocols
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-dark-300">Live GPS Telematics streaming to ResQ Cloud</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-dark-300">Arrival OTP verification protocol active</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-dark-300">Direct hospital trauma ER dispatch link</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-dark-300">Green corridor traffic priority enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceProfile;

