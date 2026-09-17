import React from "react";

/**
 * Skeleton loading placeholder with subtle pulse animation
 */
export const Skeleton = ({
  className = "",
  variant = "rectangular", // 'rectangular' | 'circular' | 'text'
  width,
  height,
}) => {
  const variantClasses = {
    rectangular: "rounded-xl",
    circular: "rounded-full",
    text: "rounded-md h-4",
  };

  return (
    <div
      className={`animate-pulse bg-dark-800/80 border border-dark-700/50 ${
        variantClasses[variant] || variantClasses.rectangular
      } ${className}`}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
    />
  );
};

export default Skeleton;

