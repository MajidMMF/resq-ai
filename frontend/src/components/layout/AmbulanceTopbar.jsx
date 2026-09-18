import React from "react";
import { Link } from "react-router-dom";
import ResQLogo from "../shared/ResQLogo";
import LiveIndicator from "../shared/LiveIndicator";
import { Truck, Wifi, WifiOff } from "lucide-react";
import useAuth from "../../hooks/useAuth";

export const AmbulanceTopbar = ({
  ambulance,
  isOnline = false,
  onToggleStatus,
  isUpdating = false,
}) => {
  const { user } = useAuth();
  const plateNumber = ambulance?.plateNumber || user?.ambulance?.plateNumber || "TS-16-MM-0004";
  const vehicleType = (ambulance?.type || "basic").toUpperCase();

  return (
    <header className="h-16 border-b border-dark-800/80 bg-dark-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Unit Callout Badge */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center text-lg">
          🚑
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-white font-mono uppercase tracking-wider">
              {plateNumber}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-600 text-cyan-400 font-mono text-[9px] font-bold uppercase">
              {vehicleType}
            </span>
          </div>
          <p className="text-[10px] text-dark-400 font-mono">
            Driver: {user?.name || "Paramedic"}
          </p>
        </div>
      </div>

      {/* Online / Offline Switch */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-1.5">
          <LiveIndicator color={isOnline ? "cyan" : "red"} label={isOnline ? "ONLINE" : "OFFLINE"} />
        </div>

        <button
          type="button"
          disabled={isUpdating}
          onClick={onToggleStatus}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition active:scale-95 flex items-center space-x-2 shadow-lg ${
            isOnline
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              : "bg-dark-800 hover:bg-dark-700 text-dark-300 border border-dark-600"
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? "Go Offline" : "Go Online"}</span>
        </button>
      </div>
    </header>
  );
};

export default AmbulanceTopbar;

