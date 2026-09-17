import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleAudioAlert,
  selectAudioAlertEnabled,
} from "../../features/hospitals/hospitalsSlice";
import { useGetMyHospitalQuery } from "../../features/hospitals/hospitalsApi";
import LiveIndicator from "../shared/LiveIndicator";
import { Volume2, VolumeX, Hospital, Bell, Shield } from "lucide-react";

export const HospitalTopbar = () => {
  const dispatch = useDispatch();
  const audioEnabled = useSelector(selectAudioAlertEnabled);
  const { data: hospitalData } = useGetMyHospitalQuery();

  const hospital = hospitalData?.data?.hospital || hospitalData?.hospital || hospitalData?.data || {};

  return (
    <header className="h-16 border-b border-dark-800 bg-dark-950/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Hospital Identity */}
      <div className="flex items-center space-x-3">
        <div className="lg:hidden flex items-center space-x-2">
          <span className="text-xl">🏥</span>
          <span className="font-extrabold text-sm text-white">ResQ ER</span>
        </div>

        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {hospital?.name || "Apex Trauma Center"}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              ER ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Center / Status */}
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-900 border border-dark-700/80">
        <LiveIndicator color="red" label="TRAUMA RADAR" />
        <span className="text-[10px] font-mono text-dark-400">WebSocket Live</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={() => dispatch(toggleAudioAlert())}
          className={`p-2 rounded-xl border transition text-xs flex items-center space-x-1.5 font-mono ${
            audioEnabled
              ? "bg-emergency-500/10 border-emergency-500/30 text-emergency-400 hover:bg-emergency-500/20"
              : "bg-dark-900 border-dark-700 text-dark-400 hover:text-white"
          }`}
          title={audioEnabled ? "Siren Alert Enabled" : "Siren Alert Muted"}
        >
          {audioEnabled ? (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="hidden md:inline text-[11px] font-bold">Siren ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden md:inline text-[11px]">Muted</span>
            </>
          )}
        </button>

        {/* Emergency Hotline */}
        {hospital?.phone && (
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono text-dark-300">
            <span className="text-dark-500">HOTLINE:</span>
            <span className="text-white font-bold">{hospital.phone}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default HospitalTopbar;

