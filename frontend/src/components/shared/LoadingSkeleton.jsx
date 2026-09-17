import React from "react";

export const LoadingSkeleton = ({ count = 3, className = "h-20" }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full rounded-xl bg-dark-800/80 border border-dark-700/50 animate-pulse ${className}`}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;

