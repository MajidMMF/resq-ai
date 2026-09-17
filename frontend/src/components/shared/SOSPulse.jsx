import React from "react";

/**
 * SOSPulse component
 * Glowing concentric shockwaves for critical emergency states, SOS buttons, and siren alerts.
 */
export const SOSPulse = ({ children, active = true, className = "" }) => {
  if (!active) return <>{children}</>;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer Pulse Wave 1 */}
      <span className="absolute inset-0 rounded-full bg-emergency-500/30 animate-ping duration-1000 pointer-events-none" />

      {/* Outer Pulse Wave 2 (delayed offset) */}
      <span
        className="absolute -inset-2 rounded-full border border-emergency-500/40 animate-pulse pointer-events-none"
        style={{ animationDuration: "2s" }}
      />

      {/* Radiant Glow */}
      <span className="absolute inset-0 rounded-full shadow-[0_0_35px_rgba(239,68,68,0.55)] pointer-events-none" />

      {/* Target Element */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SOSPulse;

