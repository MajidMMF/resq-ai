import React from "react";
import {
  Car,
  UserX,
  Flame,
  HeartPulse,
  Truck,
  AlertCircle,
  MapPin,
  Compass,
} from "lucide-react";
import MapContainer from "../../../components/maps/MapContainer";
import UserMarker from "../../../components/maps/UserMarker";
import useReverseGeocode from "../../../hooks/useReverseGeocode";

const ACCIDENT_TYPES = [
  { id: "ROAD_ACCIDENT", label: "Vehicle Collision", icon: Car, desc: "Cars, bikes, multi-vehicle" },
  { id: "PEDESTRIAN_HIT", label: "Pedestrian Struck", icon: UserX, desc: "Person hit by vehicle" },
  { id: "FIRE_OUTBREAK", label: "Fire / Explosion", icon: Flame, desc: "Vehicle or building flames" },
  { id: "MEDICAL_EMERGENCY", label: "Medical Crisis", icon: HeartPulse, desc: "Cardiac, stroke, unconscious" },
  { id: "TRUCK_ROLLOVER", label: "Heavy Vehicle / Hazmat", icon: Truck, desc: "Bus, truck, rollover" },
  { id: "OTHER_INCIDENT", label: "Other Trauma Scene", icon: AlertCircle, desc: "General accident scene" },
];

export const Step1WhatWhere = ({ formData, updateForm, nextStep }) => {
  const { type, location } = formData;
  const { placeName, address } = useReverseGeocode(location?.lat, location?.lng);

  const handleSelectType = (typeId) => {
    updateForm({ type: typeId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">What happened?</h3>
        <p className="text-xs text-dark-400">Select the nature of the emergency incident.</p>
      </div>

      {/* 6 Accident Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {ACCIDENT_TYPES.map((item) => {
          const Icon = item.icon;
          const selected = type === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleSelectType(item.id)}
              className={`p-4 rounded-xl border-2 text-left transition flex items-start space-x-3.5 ${
                selected
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-white"
                  : "border-dark-700 bg-dark-800/80 hover:border-dark-600 text-dark-300"
              }`}
            >
              <div className={`p-2.5 rounded-lg bg-dark-700 shrink-0 ${selected ? "text-cyan-400" : "text-dark-400"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-dark-400 mt-0.5">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Where / Location Preview */}
      <div className="pt-4 border-t border-dark-700/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{placeName || "Incident Location"}</span>
            </h4>
            <p className="text-[11px] text-dark-400">
              {address ? address : `Coordinates: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} (±${location.accuracy || 2}m)`}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
            <Compass className="w-3 h-3 animate-spin" />
            <span>GPS LOCKED</span>
          </div>
        </div>

        <div className="h-44 rounded-xl overflow-hidden border border-dark-700">
          <MapContainer center={[location.lat, location.lng]} zoom={15}>
            <UserMarker position={[location.lat, location.lng]} label="Accident Scene" accuracy={location.accuracy} />
          </MapContainer>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={nextStep}
          disabled={!type}
          className="px-8 py-3 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-bold text-xs shadow-lg shadow-emergency-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
        >
          Next: Add Scene Evidence &rarr;
        </button>
      </div>
    </div>
  );
};

export default Step1WhatWhere;

