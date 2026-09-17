import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const createAmbulanceIcon = (plateNumber = "AMB-104") => {
  const safePlate =
    (plateNumber || "AMBULANCE").length > 22
      ? (plateNumber || "AMBULANCE").slice(0, 20) + "…"
      : plateNumber || "AMBULANCE";
  return L.divIcon({
    className: "custom-ambulance-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); pointer-events:auto; cursor:pointer;">
        <div style="width:36px; height:36px; border-radius:12px; background:#0284c7; border:2px solid #ffffff; box-shadow:0 0 14px rgba(2,132,199,0.6); display:flex; align-items:center; justify-content:center; font-size:18px;">
          🚑
        </div>
        <div style="margin-top:2px; background:#082f49; border:1px solid #38bdf8; color:#ffffff; font-family:ui-monospace, monospace; font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; white-space:nowrap; box-shadow:0 3px 10px rgba(0,0,0,0.9); display:flex; align-items:center; gap:4px; z-index:999;">
          <span style="color:#38bdf8; font-weight:900;">🚑 AMBULANCE:</span>
          <span>${safePlate}</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export const AmbulanceMarker = ({
  position,
  plateNumber = "AMB-104",
  speed = 0,
  eta = null,
  onClick,
}) => {
  if (!position || !position[0] || !position[1]) return null;

  return (
    <Marker
      position={position}
      icon={createAmbulanceIcon(plateNumber)}
      eventHandlers={onClick ? { click: onClick } : {}}
    >
      <Popup>
        <div className="p-1 min-w-[130px]">
          <div className="flex items-center justify-between border-b border-dark-600 pb-1 mb-1">
            <span className="font-bold text-xs text-white uppercase">{plateNumber}</span>
            <span className="text-[10px] font-mono text-emergency-400 font-bold">EMERGENCY</span>
          </div>
          {eta && (
            <p className="text-[11px] text-dark-200">
              ETA: <span className="font-bold text-cyan-400 font-mono">{eta}</span>
            </p>
          )}
          {speed !== null && (
            <p className="text-[10px] text-dark-400 font-mono">
              Speed: {Math.round(speed)} km/h
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default AmbulanceMarker;

