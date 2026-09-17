import React, { useRef, useEffect, forwardRef } from "react";
import { shake } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Input component with focus glow and error shake animation
 */
export const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const internalRef = useRef(null);
    const inputRef = ref || internalRef;
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
      if (error && !prefersReducedMotion && inputRef.current) {
        shake(inputRef.current);
      }
    }, [error, prefersReducedMotion]);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label className="block text-xs font-semibold text-slate-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-dark-400 pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={inputRef}
            className={`w-full bg-dark-900 border rounded-xl py-2.5 text-sm text-slate-100 placeholder:text-dark-500 transition-all duration-200 focus:outline-none ${
              Icon ? "pl-10 pr-4" : "px-4"
            } ${
              error
                ? "border-emergency-500 focus:border-emergency-500 focus:ring-2 focus:ring-emergency-500/20"
                : "border-dark-700 hover:border-dark-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            } ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-emergency-400 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

