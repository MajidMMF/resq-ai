import React from "react";
import { Polyline } from "react-leaflet";

export const RoutePolyline = ({
  positions = [],
  color = "#22D3EE", // Cyan
  weight = 4,
  dashArray = null, // e.g. "6, 8" for dashed planned route
  opacity = 0.85,
}) => {
  if (!positions || positions.length < 2) return null;

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity,
        dashArray,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
};

export default RoutePolyline;

