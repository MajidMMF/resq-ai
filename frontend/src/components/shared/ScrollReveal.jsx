import React, { useRef, useEffect } from "react";
import gsap from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * ScrollReveal component
 * Automatically reveals contents with smooth entrance when mounted or scrolled into view
 */
export const ScrollReveal = ({
  children,
  delay = 0,
  yOffset = 20,
  duration = 0.45,
  className = "",
}) => {
  const domRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !domRef.current) return;

    gsap.fromTo(
      domRef.current,
      { opacity: 0, y: yOffset },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power2.out",
      }
    );
  }, [delay, yOffset, duration, prefersReducedMotion]);

  return (
    <div ref={domRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal;

