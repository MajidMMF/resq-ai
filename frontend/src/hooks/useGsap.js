import { useLayoutEffect, useEffect, useRef } from "react";
import gsap from "../lib/gsap";
import { useReducedMotion } from "./useReducedMotion";

// SSR safe layout effect
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Hook for executing GSAP animations with automatic lifecycle cleanup and reduced motion support.
 * @param {Function} animationCallback - Callback receiving gsap instance and context
 * @param {Array} dependencies - React dependency array
 * @param {Object} scopeRef - Optional React ref for DOM scoping
 */
export const useGsap = (animationCallback, dependencies = [], scopeRef = null) => {
  const prefersReducedMotion = useReducedMotion();
  const savedCallback = useRef(animationCallback);

  useEffect(() => {
    savedCallback.current = animationCallback;
  }, [animationCallback]);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (typeof savedCallback.current === "function") {
        savedCallback.current(gsap);
      }
    }, scopeRef?.current || undefined);

    return () => ctx.revert();
  }, [prefersReducedMotion, ...dependencies]);
};

export default useGsap;

