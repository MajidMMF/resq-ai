import React, { useEffect } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Auto-pan to center when it updates
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};


export const MapContainer = ({
  center = [28.6139, 77.209], // Default New Delhi
  zoom = 13,
  bounds = null,
  className = "w-full h-full min-h-[260px] rounded-2xl overflow-hidden",
  children,
}) => {
  return (
    <div className={`relative ${className}`}>
      <LeafletMap
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* 100% Free OpenStreetMap Tiles with Dark Theme Filter (No API Key Required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tiles"
          maxZoom={19}
        />
        <ChangeView center={center} zoom={zoom} />
        {children}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;

