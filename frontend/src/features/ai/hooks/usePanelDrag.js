import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Hook to handle dragging the AI panel via its header
 */
export const usePanelDrag = (initialPos = null, isMobile = false, onPositionChange = null) => {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const handleMouseDown = useCallback(
    (e) => {
      // Don't drag if on mobile, or clicked on an interactive control button inside header
      if (isMobile || e.target.closest("button") || e.target.closest("input")) return;

      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: position?.x ?? 0,
        posY: position?.y ?? 0,
      };
      e.preventDefault();
    },
    [isMobile, position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const newX = dragStartRef.current.posX + deltaX;
      const newY = dragStartRef.current.posY + deltaY;

      // Restrict within viewport bounds
      const clampedX = Math.min(Math.max(newX, -window.innerWidth + 200), window.innerWidth - 100);
      const clampedY = Math.min(Math.max(newY, -window.innerHeight + 100), window.innerHeight - 100);

      const nextPos = { x: clampedX, y: clampedY };
      setPosition(nextPos);
      onPositionChange?.(nextPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  return {
    position,
    setPosition,
    isDragging,
    handleMouseDown,
  };
};

export default usePanelDrag;

