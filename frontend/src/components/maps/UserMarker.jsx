import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Custom pulsing emergency red/cyan HTML pin with visible label
const createUserIcon = (label = "Accident Scene") => {
  const safeLabel =
    (label || "Emergency").length > 25
      ? (label || "Emergency").slice(0, 23) + "…"
      : label || "Emergency";
  return L.divIcon({
    className: "custom-user-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); pointer-events:auto; cursor:pointer;">
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
          <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:#ef4444; opacity:0.6; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="width:20px; height:20px; border-radius:50%; background:#dc2626; border:2px solid #ffffff; box-shadow:0 0 12px #ef4444; display:flex; align-items:center; justify-content:center; font-size:11px;">🚨</span>
        </div>
        <div style="margin-top:2px; background:#450a0a; border:1px solid #f87171; color:#ffffff; font-family:ui-monospace, monospace; font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.9); display:flex; align-items:center; gap:4px; z-index:999;">
          <span style="color:#fca5a5; font-weight:900;">🚨 INCIDENT:</span>
          <span>${safeLabel}</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export const UserMarker = ({
  position,
  label = "You (Accident Scene)",
  accuracy = null,
  onClick,
}) => {
  if (!position || !position[0] || !position[1]) return null;

  return (
    <Marker
      position={position}
      icon={createUserIcon(label)}
      eventHandlers={onClick ? { click: onClick } : {}}
    >
      <Popup>
        <div className="p-1 text-center">
          <p className="font-bold text-xs text-white">{label}</p>
          {accuracy && (
            <p className="text-[10px] text-cyan-400 font-mono mt-0.5">
              GPS Accuracy: ±{accuracy}m
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default UserMarker;

