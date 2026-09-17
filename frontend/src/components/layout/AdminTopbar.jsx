import React from "react";
import LiveIndicator from "../shared/LiveIndicator";
import { ShieldAlert, Radio, Server, Activity, Users } from "lucide-react";

export const AdminTopbar = () => {
  return (
    <header className="h-16 border-b border-dark-800 bg-dark-950/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="lg:hidden flex items-center space-x-2">
          <span className="text-xl">🛡️</span>
          <span className="font-extrabold text-sm text-white">Ops Command</span>
        </div>

        <div className="hidden lg:flex items-center space-x-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            ResQ AI National Emergency Network Hub
          </span>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-mono font-bold">
            MASTER AUTHORITY
          </span>
        </div>
      </div>

      {/* Grid Cluster Status */}
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-900 border border-dark-700/80">
        <LiveIndicator color="green" label="CLUSTER ONLINE" />
        <span className="text-[10px] font-mono text-dark-400">9 Microservices Up</span>
      </div>

      {/* Telemetry Chips */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-dark-300">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>API Gateway: 8000</span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-dark-300">
          <Radio className="w-3.5 h-3.5 text-emergency-400 animate-pulse" />
          <span className="text-white font-bold">WebSocket: 8010</span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;

