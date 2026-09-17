import React from "react";

/**
 * ShimmerLoader component
 * Premium streaming beam effect across cards and panels
 */
export const ShimmerLoader = ({ height = "h-2", className = "" }) => {
  return (
    <div className={`relative overflow-hidden w-full bg-dark-800 rounded-full ${height} ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
    </div>
  );
};

export default ShimmerLoader;

