import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const createHospitalIcon = (name = "Hospital") => {
  const safeName =
    (name || "Hospital").length > 20
      ? (name || "Hospital").slice(0, 18) + "…"
      : name || "Hospital";
  return L.divIcon({
    className: "custom-hospital-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); pointer-events:auto; cursor:pointer;">
        <div style="width:36px; height:36px; border-radius:12px; background:#090d16; border:2px solid #ef4444; box-shadow:0 0 14px rgba(239,68,68,0.5); display:flex; align-items:center; justify-content:center; font-size:18px;">
          🏥
        </div>
        <div style="margin-top:2px; background:#0f172a; border:1px solid #ef4444; color:#ffffff; font-family:ui-monospace, monospace; font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.9); display:flex; align-items:center; gap:4px; z-index:999;">
          <span style="color:#f87171; font-weight:900;">🏥 HOSPITAL:</span>
          <span>${safeName}</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export const HospitalMarker = ({
  position,
  name = "Emergency Center",
  traumaLevel = "LEVEL_1",
  bedsAvailable = null,
  onClick,
}) => {
  if (!position || !position[0] || !position[1]) return null;

  return (
    <Marker
      position={position}
      icon={createHospitalIcon(name)}
      eventHandlers={onClick ? { click: onClick } : {}}
    >
      <Popup>
        <div className="p-1 min-w-[140px]">
          <p className="font-bold text-xs text-white leading-snug">{name}</p>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-emergency-500/20 text-emergency-400 text-[9px] font-bold">
              {traumaLevel}
            </span>
            {bedsAvailable !== null && (
              <span className="text-[10px] text-dark-300 font-mono">
                {bedsAvailable} beds open
              </span>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default HospitalMarker;

