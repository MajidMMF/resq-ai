import React from "react";

export const ResQLogo = ({ className = "w-10 h-10", pulse = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-xl bg-emergency-500 opacity-30"></span>
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Shield Background */}
        <path
          d="M50 8L88 22V52C88 74 72 90 50 96C28 90 12 74 12 52V22L50 8Z"
          fill="url(#shieldGrad)"
          stroke="#EF4444"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Medical / Rescue Cross */}
        <path
          d="M43 32H57V43H68V57H57V68H43V57H32V43H43V32Z"
          fill="#FFFFFF"
        />
        {/* Glowing Tech Pulse Ring Core */}
        <circle cx="50" cy="50" r="4" fill="#06B6D4" />

        <defs>
          <linearGradient id="shieldGrad" x1="50" y1="8" x2="50" y2="96" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1A2332" />
            <stop offset="0.6" stopColor="#0F1626" />
            <stop offset="1" stopColor="#991B1B" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default ResQLogo;

