import { useState, useEffect } from "react";

/**
 * Hook to manage responsive dimensions for the AI Chat Panel
 */
export const usePanelSize = (isExpanded = false, isMinimized = false) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 640;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getDimensions = () => {
    if (isMinimized) {
      return {
        width: isMobile ? "calc(100vw - 32px)" : "360px",
        height: "56px",
      };
    }

    if (isMobile) {
      return {
        width: "calc(100vw - 32px)",
        height: isExpanded ? "85vh" : "70vh",
      };
    }

    // Desktop
    if (isExpanded) {
      return {
        width: "560px",
        height: "680px",
      };
    }

    // Default desktop floating
    return {
      width: "380px",
      height: "520px",
    };
  };

  return {
    isMobile,
    dimensions: getDimensions(),
  };
};

export default usePanelSize;

