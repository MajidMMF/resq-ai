import React from "react";
import { AlertCircle } from "lucide-react";

export const EmptyState = ({
  icon: Icon = AlertCircle,
  title = "No data found",
  description = "There are no items to display at this moment.",
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-dark-800/50 border border-dark-700/60 rounded-2xl ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-dark-700/80 border border-dark-600 flex items-center justify-center mb-4 text-dark-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-dark-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-medium text-xs shadow-md transition active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

