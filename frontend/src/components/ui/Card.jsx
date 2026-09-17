import React, { useRef, useEffect } from "react";
import { cardEnter, hoverLift, hoverReset } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Card component with GSAP entrance fade-in and optional hover lift
 */
export const Card = ({
  children,
  animateOnMount = true,
  interactive = false,
  className = "",
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (animateOnMount && !prefersReducedMotion && cardRef.current) {
      cardEnter(cardRef.current);
    }
  }, [animateOnMount, prefersReducedMotion]);

  const handleMouseEnter = (e) => {
    if (interactive && !prefersReducedMotion && cardRef.current) {
      hoverLift(cardRef.current, -4);
    }
    props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    if (interactive && !prefersReducedMotion && cardRef.current) {
      hoverReset(cardRef.current);
    }
    props.onMouseLeave?.(e);
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`bg-dark-900 border border-dark-800 rounded-2xl p-4 transition-shadow ${
        interactive ? "cursor-pointer hover:border-dark-700 hover:shadow-xl hover:shadow-cyan-500/5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

