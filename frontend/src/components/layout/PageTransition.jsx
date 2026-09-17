import React, { useRef } from "react";
import { useGsap } from "../../hooks/useGsap";
import { pageEnter } from "../../lib/gsap";

/**
 * PageTransition wrapper component
 * Provides smooth fade & slide-in transitions on mount
 */
export const PageTransition = ({ children, className = "" }) => {
  const containerRef = useRef(null);

  useGsap(
    () => {
      pageEnter(containerRef.current);
    },
    [],
    containerRef
  );

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;

