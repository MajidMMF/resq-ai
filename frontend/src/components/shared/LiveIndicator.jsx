import React from "react";

export const LiveIndicator = ({ label = "LIVE", color = "cyan", pulse = true }) => {
  const isRed = color === "emergency" || color === "red";

  return (
    <span className="inline-flex items-center space-x-1.5 text-xs font-mono tracking-wider font-semibold">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isRed ? "bg-emergency-400" : "bg-cyan-400"
            }`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isRed ? "bg-emergency-500" : "bg-cyan-400"
          }`}
        />
      </span>
      <span className={isRed ? "text-emergency-400" : "text-cyan-400"}>{label}</span>
    </span>
  );
};

export default LiveIndicator;

