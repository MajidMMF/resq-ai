import React from "react";
import { Truck, Check, Navigation, Clock } from "lucide-react";

export const AmbulanceCard = ({ ambulance, onSelect, isSelected, isBooking }) => {
  const plateNumber = ambulance?.plateNumber || "Registered EMS Unit";
  const type = ambulance?.type || "advanced";
  const distanceKm = ambulance?.distanceKm || 2.1;

  const estimatedMinutes = Math.max(2, Math.round(distanceKm * 2.5));

  return (
    <div
      className={`p-5 rounded-2xl border-2 transition ${
        isSelected
          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          : "border-dark-700 bg-dark-800/80 hover:border-dark-600"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center text-2xl shrink-0">
            🚑
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white uppercase font-mono">{plateNumber}</h4>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase">
                {type}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-dark-300 mt-1">
              <span className="flex items-center gap-1 font-mono text-cyan-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>ETA ~{estimatedMinutes} mins</span>
              </span>
              <span>•</span>
              <span className="text-dark-400">{distanceKm} km away</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(ambulance)}
          disabled={isBooking}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center space-x-1.5 shrink-0 ${
            isSelected
              ? "bg-cyan-400 text-dark-950 shadow-md shadow-cyan-400/30"
              : "bg-emergency-600 hover:bg-emergency-500 text-white shadow-md shadow-emergency-600/30"
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              <span>Unit Booked</span>
            </>
          ) : (
            <span>Book Ambulance</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AmbulanceCard;

