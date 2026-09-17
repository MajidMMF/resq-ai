import React, { useRef, useEffect } from "react";
import { flipElement } from "../../lib/gsap";

const STATUS_CONFIG = {
  REQUESTED: {
    label: "Requested",
    bg: "bg-warning-500/10 border-warning-500/30 text-warning-400",
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  },
  EN_ROUTE: {
    label: "En Route",
    bg: "bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse",
  },
  ARRIVED: {
    label: "Arrived",
    bg: "bg-emergency-500/20 border-emergency-500 text-emergency-300 font-bold",
  },
  OTP_VERIFIED: {
    label: "OTP Verified",
    bg: "bg-success-500/15 border-success-500/40 text-success-400",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-success-500/10 border-success-500/30 text-success-400",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-success-500/10 border-success-500/30 text-success-400",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-dark-600/40 border-dark-500 text-dark-400",
  },
  REJECTED: {
    label: "Declined",
    bg: "bg-emergency-500/10 border-emergency-500/30 text-emergency-400",
  },
};

export const StatusBadge = ({ status, className = "" }) => {
  const badgeRef = useRef(null);
  const prevStatusRef = useRef(status);
  const normStatus = (status || "REQUESTED").toUpperCase();
  const config = STATUS_CONFIG[normStatus] || {
    label: status,
    bg: "bg-dark-700 border-dark-600 text-dark-300",
  };

  useEffect(() => {
    if (prevStatusRef.current !== status && badgeRef.current) {
      flipElement(badgeRef.current);
      prevStatusRef.current = status;
    }
  }, [status]);

  return (
    <span
      ref={badgeRef}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors duration-200 ${config.bg} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;

