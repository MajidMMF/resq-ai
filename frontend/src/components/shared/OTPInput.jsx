import React, { useRef, useEffect } from "react";

export const OTPInput = ({
  length = 6,
  value = [],
  onChange,
  disabled = false,
  onComplete,
}) => {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first empty input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Allow only single numeric digit
    const digit = val.replace(/\D/g, "").slice(-1);

    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    // Auto advance if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check complete
    if (newOtp.join("").length === length && onComplete) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pastedData) return;

    const newOtp = [...value];
    for (let i = 0; i < length; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    onChange(newOtp);

    // Focus last filled or next input
    const nextFocusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          disabled={disabled}
          className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed selection:bg-transparent"
        />
      ))}
    </div>
  );
};

export default OTPInput;

