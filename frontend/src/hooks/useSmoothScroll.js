import { useCallback } from "react";

/**
 * Hook for smooth scrolling to an element or container bottom
 */
export const useSmoothScroll = () => {
  const scrollToRef = useCallback((targetRef, offset = 0) => {
    if (!targetRef?.current) return;
    const element = targetRef.current;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  }, []);

  const scrollToBottom = useCallback((containerRef) => {
    if (!containerRef?.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  return { scrollToRef, scrollToBottom };
};

export default useSmoothScroll;

