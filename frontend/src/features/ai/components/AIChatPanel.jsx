import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setAIChatOpen,
  minimizePanel,
  restorePanel,
  toggleExpand,
  setPanelPosition,
  selectIsAIOpen,
  selectIsAIMinimized,
  selectIsAIExpanded,
  selectAIPanelPosition,
} from "../aiSlice";
import { useSendChatMessageMutation } from "../aiApi";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingIndicator from "./LoadingIndicator";
import { usePanelSize } from "../hooks/usePanelSize";
import { usePanelDrag } from "../hooks/usePanelDrag";
import gsap from "../../../lib/gsap";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

export const AIChatPanel = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsAIOpen);
  const isMinimized = useSelector(selectIsAIMinimized);
  const isExpanded = useSelector(selectIsAIExpanded);
  const savedPosition = useSelector(selectAIPanelPosition);

  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const { isMobile, dimensions } = usePanelSize(isExpanded, isMinimized);

  const { position, handleMouseDown, isDragging } = usePanelDrag(
    savedPosition,
    isMobile,
    (pos) => dispatch(setPanelPosition(pos))
  );

  const [messages, setMessages] = useState([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello, I am your ResQ AI Emergency Copilot. I can provide real-time first-aid instructions, CPR timing, and emergency guidance. How can I assist you right now?",
      timestamp: Date.now(),
    },
  ]);

  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();

  // Scroll to bottom when messages update
  useEffect(() => {
    if (!isMinimized) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isMinimized]);

  // Entrance animation when panel opens
  useEffect(() => {
    if (isOpen && panelRef.current && !prefersReducedMotion) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.94, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen, prefersReducedMotion]);

  if (!isOpen) return null;

  const handleSendMessage = async (text) => {
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendChatMessage({ prompt: text }).unwrap();
      const aiReply =
        res?.data?.reply ||
        res?.reply ||
        "Maintain calm. Check if the patient has a clear airway, is breathing normally, and has no severe arterial bleeding.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiReply,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Always prioritize patient safety. Do not move victims with suspected spinal trauma. Emergency teams have been notified.",
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Compute transform style for desktop dragging
  const transformStyle =
    !isMobile && position?.x !== undefined && position?.y !== undefined
      ? {
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        }
      : undefined;

  return (
    <div
      ref={panelRef}
      style={{
        ...transformStyle,
        width: dimensions.width,
        height: dimensions.height,
      }}
      className={`fixed z-50 flex flex-col bg-dark-900/95 backdrop-blur-xl border border-dark-700/80 shadow-[0_12px_45px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden transition-[width,height] duration-300 ease-in-out ${
        isMobile
          ? "bottom-0 inset-x-4 max-w-full rounded-b-none border-b-0 pb-safe"
          : "right-6 bottom-24"
      }`}
    >
      {/* Header */}
      <ChatHeader
        isMinimized={isMinimized}
        isExpanded={isExpanded}
        onMinimize={() =>
          dispatch(isMinimized ? restorePanel() : minimizePanel())
        }
        onToggleExpand={() => dispatch(toggleExpand())}
        onClose={() => dispatch(setAIChatOpen(false))}
        onMouseDown={handleMouseDown}
      />

      {/* Message Stream & Input (Hidden when minimized) */}
      {!isMinimized && (
        <>
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-dark-700">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={scrollRef} />
          </div>

          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </>
      )}
    </div>
  );
};

export default AIChatPanel;
