import React from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  HeartPulse,
} from "lucide-react";

export const SystemAnalytics = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          System Performance & Dispatch Analytics
        </h1>
        <p className="text-xs text-dark-400 mt-1">
          High-resolution telemetry metrics measuring Golden Hour survival rates, AI triage precision, and fleet latency.
        </p>
      </div>

      {/* 2. CORE PERFORMANCE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-dark-400">
            Average Response Time
          </span>
          <span className="text-3xl font-black text-cyan-400 font-mono block">
            4.8 Mins
          </span>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>52% faster than 108 manual dispatch</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-dark-400">
            AI Triage Accuracy
          </span>
          <span className="text-3xl font-black text-emerald-400 font-mono block">
            99.2%
          </span>
          <span className="text-[10px] font-mono text-dark-400">
            Verified across 1,420 trauma cases
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-dark-400">
            Golden Hour Survival Rate
          </span>
          <span className="text-3xl font-black text-white font-mono block">
            94.6%
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            Pre-hospital arrival mortality reduced
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-dark-400">
            Arrival OTP Security
          </span>
          <span className="text-3xl font-black text-purple-400 font-mono block">
            100%
          </span>
          <span className="text-[10px] font-mono text-dark-400">
            Zero fraudulent or diverted pickups
          </span>
        </div>
      </div>

      {/* 3. DETAILED PERFORMANCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown Card 1 */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase font-mono">
              Pipeline Stage Latency Breakdown
            </h2>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div>
              <div className="flex justify-between text-dark-300 mb-1">
                <span>Citizen SOS to AI Triage</span>
                <span className="text-cyan-400 font-bold">1.8 seconds</span>
              </div>
              <div className="h-2 rounded-full bg-dark-950 overflow-hidden border border-dark-800">
                <div className="h-full bg-cyan-400 rounded-full w-[15%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-dark-300 mb-1">
                <span>Ambulance Auto-Match & Notification</span>
                <span className="text-emerald-400 font-bold">2.4 seconds</span>
              </div>
              <div className="h-2 rounded-full bg-dark-950 overflow-hidden border border-dark-800">
                <div className="h-full bg-emerald-400 rounded-full w-[20%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-dark-300 mb-1">
                <span>Hospital ER Trauma Bed Reservation</span>
                <span className="text-purple-400 font-bold">3.1 seconds</span>
              </div>
              <div className="h-2 rounded-full bg-dark-950 overflow-hidden border border-dark-800">
                <div className="h-full bg-purple-400 rounded-full w-[25%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-dark-300 mb-1">
                <span>Average Scene Transit & Pickup</span>
                <span className="text-emergency-400 font-bold">4.2 minutes</span>
              </div>
              <div className="h-2 rounded-full bg-dark-950 overflow-hidden border border-dark-800">
                <div className="h-full bg-emergency-500 rounded-full w-[85%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Card 2 */}
        <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
          <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase font-mono">
              Clinical Trauma Categorization
            </h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex justify-between items-center">
              <span className="text-emergency-400 font-bold">CRITICAL TIER 1 (Spinal / Arterial)</span>
              <span className="text-white font-mono font-bold">42% of cases</span>
            </div>
            <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex justify-between items-center">
              <span className="text-amber-400 font-bold">HIGH PRIORITY (Fractures / Lacerations)</span>
              <span className="text-white font-mono font-bold">38% of cases</span>
            </div>
            <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex justify-between items-center">
              <span className="text-cyan-400 font-bold">MODERATE / STABLE (Minor Contusions)</span>
              <span className="text-white font-mono font-bold">20% of cases</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;

