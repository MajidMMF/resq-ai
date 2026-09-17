import React, { useRef, forwardRef } from "react";
import { buttonPress, hoverLift, hoverReset } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Loader2 } from "lucide-react";

/**
 * Button component with micro-interactions (press scale, hover lift)
 */
export const Button = forwardRef(
  (
    {
      children,
      variant = "primary", // 'primary' | 'danger' | 'secondary' | 'outline' | 'ghost'
      size = "md", // 'sm' | 'md' | 'lg'
      isLoading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef(null);
    const buttonRef = ref || internalRef;
    const prefersReducedMotion = useReducedMotion();

    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold focus:ring-cyan-400 shadow-md shadow-cyan-500/20",
      danger:
        "bg-emergency-600 hover:bg-emergency-500 text-white font-bold focus:ring-emergency-500 shadow-md shadow-emergency-600/25",
      secondary:
        "bg-dark-800 hover:bg-dark-700 text-slate-100 border border-dark-700 focus:ring-slate-400",
      outline:
        "border border-dark-600 hover:border-cyan-400 text-dark-200 hover:text-white bg-transparent focus:ring-cyan-400",
      ghost:
        "bg-transparent hover:bg-dark-800 text-dark-300 hover:text-white focus:ring-slate-400",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5",
    };

    const handleMouseEnter = (e) => {
      if (!disabled && !isLoading && !prefersReducedMotion && buttonRef.current) {
        hoverLift(buttonRef.current, -2);
      }
      props.onMouseEnter?.(e);
    };

    const handleMouseLeave = (e) => {
      if (!disabled && !isLoading && !prefersReducedMotion && buttonRef.current) {
        hoverReset(buttonRef.current);
      }
      props.onMouseLeave?.(e);
    };

    const handleClick = (e) => {
      if (disabled || isLoading) return;
      if (!prefersReducedMotion && buttonRef.current) {
        buttonPress(buttonRef.current);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={buttonRef}
        type={props.type || "button"}
        disabled={disabled || isLoading}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${
          sizeStyles[size] || sizeStyles.md
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />
        )}
        {children}
        {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

