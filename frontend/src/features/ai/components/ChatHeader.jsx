import React from "react";
import { Bot, Sparkles, Minus, Square, Maximize2, Minimize2, X, GripHorizontal } from "lucide-react";

/**
 * ChatHeader component for AIChatPanel
 * Features drag handle, status beacon, minimize, expand/restore, and close buttons
 */
export const ChatHeader = ({
  isMinimized = false,
  isExpanded = false,
  onMinimize,
  onToggleExpand,
  onClose,
  onMouseDown,
}) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`p-3 sm:p-3.5 border-b border-dark-700/80 bg-dark-950/95 backdrop-blur-md flex items-center justify-between select-none ${
        !isMinimized ? "cursor-move" : "cursor-pointer"
      } rounded-t-2xl`}
    >
      {/* Title & Status Beacon */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
            <span>ResQ Medical Copilot</span>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </h3>
          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {isMinimized ? "Docked — Click to Expand" : "Active First-Aid Assistant"}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-1 text-dark-400">
        {/* Drag Indicator (Desktop visual) */}
        <div className="hidden sm:flex items-center px-1 text-dark-500 hover:text-dark-300">
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Minimize Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize?.();
          }}
          title={isMinimized ? "Restore" : "Minimize"}
          className="p-1.5 rounded-lg hover:text-white hover:bg-dark-800 transition"
        >
          {isMinimized ? <Square className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        </button>

        {/* Maximize / Normal Toggle Button */}
        {!isMinimized && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            title={isExpanded ? "Collapse" : "Expand"}
            className="hidden sm:inline-flex p-1.5 rounded-lg hover:text-white hover:bg-dark-800 transition"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          title="Close Copilot"
          className="p-1.5 rounded-lg hover:text-white hover:bg-emergency-500/20 hover:text-emergency-400 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;

