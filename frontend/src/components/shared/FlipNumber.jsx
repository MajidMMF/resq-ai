import React, { useEffect, useRef, useState } from "react";
import gsap from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * FlipNumber component
 * Smooth rolling / tweening numeric display for counters, metrics, and ETAs.
 */
export const FlipNumber = ({
  value = 0,
  duration = 0.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const tweenRef = useRef({ val: value });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const currentVal = tweenRef.current.val;
    gsap.to(tweenRef.current, {
      val: Number(value) || 0,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayValue(
          decimals > 0
            ? tweenRef.current.val.toFixed(decimals)
            : Math.round(tweenRef.current.val)
        );
      },
    });
  }, [value, duration, decimals, prefersReducedMotion]);

  return (
    <span className={`inline-block font-mono tracking-tight ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export default FlipNumber;

