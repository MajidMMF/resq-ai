import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleAIChat,
  restorePanel,
  selectIsAIOpen,
  selectIsAIMinimized,
} from "../aiSlice";
import { Bot, Sparkles } from "lucide-react";

export const AIFloatingButton = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsAIOpen);
  const isMinimized = useSelector(selectIsAIMinimized);

  const handleClick = () => {
    if (isOpen && isMinimized) {
      dispatch(restorePanel());
    } else {
      dispatch(toggleAIChat());
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="ResQ AI Emergency Copilot"
      className="fixed right-5 bottom-20 lg:bottom-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-indigo-500 text-dark-950 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 transition-all group"
    >
      <div className="relative">
        <Bot className="w-6 h-6 text-dark-950 group-hover:rotate-12 transition-transform" />
        <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
      </div>

      {/* Pulsing indicator ring */}
      <span className="absolute inset-0 rounded-full border-2 border-cyan-300/40 animate-ping pointer-events-none" />
    </button>
  );
};

export default AIFloatingButton;
