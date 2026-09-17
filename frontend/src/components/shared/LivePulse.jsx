import React from "react";

/**
 * LivePulse indicator dot with soft ambient pulsing beacon rings.
 */
export const LivePulse = ({
  color = "emerald", // 'emerald' | 'cyan' | 'amber' | 'rose'
  size = "md", // 'sm' | 'md' | 'lg'
  label,
  className = "",
}) => {
  const colorMap = {
    emerald: {
      dot: "bg-emerald-400",
      ping: "bg-emerald-400/50",
      halo: "border-emerald-500/30",
    },
    cyan: {
      dot: "bg-cyan-400",
      ping: "bg-cyan-400/50",
      halo: "border-cyan-500/30",
    },
    amber: {
      dot: "bg-amber-400",
      ping: "bg-amber-400/50",
      halo: "border-amber-500/30",
    },
    rose: {
      dot: "bg-rose-500",
      ping: "bg-rose-500/50",
      halo: "border-rose-500/30",
    },
  };

  const sizeMap = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const selectedColor = colorMap[color] || colorMap.emerald;
  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex items-center justify-center">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedColor.ping}`}
        />
        <span
          className={`relative inline-flex rounded-full ${selectedSize} ${selectedColor.dot} shadow-sm`}
        />
      </span>
      {label && <span className="text-xs font-medium text-slate-300">{label}</span>}
    </div>
  );
};

export default LivePulse;

