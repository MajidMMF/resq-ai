import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const PasswordInput = ({
  value,
  onChange,
  placeholder = "••••••••",
  error,
  disabled = false,
  id,
  name = "password",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-dark-700 border ${
          error ? "border-emergency-500" : "border-dark-600"
        } rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-slate-200 transition-colors focus:outline-none p-1"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;

