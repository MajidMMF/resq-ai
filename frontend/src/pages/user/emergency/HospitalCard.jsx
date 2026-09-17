import React from "react";
import { Building2, Phone, MapPin, Check, Bed } from "lucide-react";

export const HospitalCard = ({ hospital, onSelect, isSelected }) => {
  const {
    name = "Metro Trauma Center",
    address = { street: "12 Medical Blvd", city: "Delhi" },
    phone = "+91 11 2345678",
    distanceKm = 3.4,
    capability = {},
  } = hospital;

  const traumaLevel = capability?.traumaLevel || "LEVEL_1";
  const beds = capability?.beds || { icu: 4, emergency: 12 };

  const addressText =
    typeof hospital.address === "string" && hospital.address.trim()
      ? hospital.address
      : hospital.address?.street
      ? `${hospital.address.street}${hospital.address.city ? `, ${hospital.address.city}` : ""}`
      : "Verified hospital facility";

  return (
    <div
      className={`p-5 rounded-2xl border-2 transition ${
        isSelected
          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          : "border-dark-700 bg-dark-800/80 hover:border-dark-600"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emergency-500" />
            <h4 className="text-sm font-bold text-white">{name}</h4>
            <span className="px-2 py-0.5 rounded bg-emergency-500/20 text-emergency-400 text-[10px] font-bold">
              {traumaLevel}
            </span>
          </div>

          <p className="text-xs text-dark-400 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-dark-500 shrink-0" />
            <span>
              {addressText} • <span className="text-cyan-400 font-mono font-bold">{distanceKm} km away</span>
            </span>
          </p>

          {/* Bed Availability */}
          <div className="flex items-center space-x-3 mt-3 text-xs text-dark-300">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-cyan-400" />
              <span>ER Beds: <strong className="text-white font-mono">{beds.emergency || "Available"}</strong></span>
            </span>
            <span>•</span>
            <span>
              ICU: <strong className="text-white font-mono">{beds.icu || "Available"}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:self-center shrink-0">
          <a
            href={`tel:${phone}`}
            className="p-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition"
            title="Call Desk"
          >
            <Phone className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => onSelect(hospital)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center space-x-1.5 ${
              isSelected
                ? "bg-cyan-400 text-dark-950 shadow-md shadow-cyan-400/30"
                : "bg-emergency-600 hover:bg-emergency-500 text-white shadow-md shadow-emergency-600/30"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" />
                <span>Selected</span>
              </>
            ) : (
              <span>Select Destination</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;

