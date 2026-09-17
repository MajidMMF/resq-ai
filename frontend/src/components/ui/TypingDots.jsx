import React from "react";

/**
 * TypingDots component
 * Fluid 3-dot pulse for conversational AI typing status
 */
export const TypingDots = ({ color = "bg-cyan-400", className = "" }) => {
  return (
    <div className={`inline-flex items-center space-x-1.5 py-1 px-2 ${className}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce`}
        style={{ animationDelay: "0ms", animationDuration: "1s" }}
      />
      <span
        className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce`}
        style={{ animationDelay: "180ms", animationDuration: "1s" }}
      />
      <span
        className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce`}
        style={{ animationDelay: "360ms", animationDuration: "1s" }}
      />
    </div>
  );
};

export default TypingDots;

