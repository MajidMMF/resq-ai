import React from "react";

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: "Critical",
    dot: "bg-emergency-500",
    badge: "bg-emergency-500/15 border-emergency-500/40 text-emergency-400 font-bold",
  },
  HIGH: {
    label: "High",
    dot: "bg-emergency-400",
    badge: "bg-emergency-500/10 border-emergency-500/30 text-emergency-400",
  },
  MEDIUM: {
    label: "Medium",
    dot: "bg-warning-400",
    badge: "bg-warning-500/10 border-warning-500/30 text-warning-400",
  },
  LOW: {
    label: "Low",
    dot: "bg-success-400",
    badge: "bg-success-500/10 border-success-500/30 text-success-400",
  },
};

export const PriorityBadge = ({ priority = "MEDIUM", className = "" }) => {
  const normPriority = (priority || "MEDIUM").toUpperCase();
  const config = PRIORITY_CONFIG[normPriority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;

