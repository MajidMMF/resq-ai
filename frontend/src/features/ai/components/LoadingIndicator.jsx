import React from "react";
import { Bot, Loader2 } from "lucide-react";

export const LoadingIndicator = () => {
  return (
    <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-dark-800 border border-dark-700 w-fit text-xs text-cyan-400">
      <Bot className="w-4 h-4 animate-bounce" />
      <div className="flex items-center space-x-1">
        <span>ResQ AI analyzing</span>
        <span className="animate-pulse">...</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;

