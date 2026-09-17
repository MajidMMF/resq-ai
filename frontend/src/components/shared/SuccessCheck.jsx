import React, { useEffect, useRef } from "react";
import gsap from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * SuccessCheck component
 * Animated stroke checkmark for verified OTP / admission confirmation
 */
export const SuccessCheck = ({ size = 56, color = "#10B981", className = "" }) => {
  const circleRef = useRef(null);
  const checkRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const tl = gsap.timeline();
    tl.fromTo(
      circleRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
    ).fromTo(
      checkRef.current,
      { strokeDashoffset: 40 },
      { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" },
      "-=0.15"
    );

    return () => tl.kill();
  }, [prefersReducedMotion]);

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 52 52"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
      >
        <circle
          ref={circleRef}
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          className="opacity-90"
        />
        <path
          ref={checkRef}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset={prefersReducedMotion ? "0" : "40"}
          d="M14 27l8 8 16-16"
        />
      </svg>
    </div>
  );
};

export default SuccessCheck;

