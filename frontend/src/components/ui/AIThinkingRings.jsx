import React from "react";
import { Bot, Sparkles } from "lucide-react";

/**
 * AIThinkingRings component
 * Multi-layer pulsing orbital rings for AI synthesis and processing states.
 */
export const AIThinkingRings = ({ size = "md", className = "" }) => {
  const sizeMap = {
    sm: { box: "w-10 h-10", icon: "w-4 h-4" },
    md: { box: "w-14 h-14", icon: "w-6 h-6" },
    lg: { box: "w-20 h-20", icon: "w-8 h-8" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative inline-flex items-center justify-center ${currentSize.box} ${className}`}>
      {/* Outer spinning ring */}
      <span className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_6s_linear_infinite]" />

      {/* Inner counter-spinning glow ring */}
      <span className="absolute inset-1.5 rounded-full border border-indigo-400/50 animate-[spin_4s_linear_infinite_reverse]" />

      {/* Soft central glow */}
      <span className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 animate-pulse" />

      {/* Central Bot Icon */}
      <div className="relative z-10 text-cyan-300">
        <Bot className={`${currentSize.icon} animate-bounce`} style={{ animationDuration: "2s" }} />
        <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
      </div>
    </div>
  );
};

export default AIThinkingRings;

