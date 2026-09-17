import React, { useState, useEffect } from "react";
import { KeyRound, ShieldAlert, Truck, Check, Copy } from "lucide-react";

export const OTPDisplay = ({
  otp = "4829",
  status = "EN_ROUTE",
  ambulance = null,
  initialSeconds = 600,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCopy = () => {
    if (!otp) return;
    navigator.clipboard?.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  const isArrived = status === "ARRIVED";
  const plateNumber = ambulance?.plateNumber || ambulance?.vehicleNumber || "REGISTERED AMBULANCE";
  const ambulanceType = ambulance?.type ? ambulance.type.toUpperCase() : "EMERGENCY UNIT";

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-dark-900 via-dark-800 to-cyan-950/30 border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-6">
      {/* Top Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-700/70 pb-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emergency-500/20 border border-emergency-500/40 text-emergency-400 text-xs font-black uppercase tracking-wider self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping" />
          <span>
            {isArrived ? "🚑 Paramedic Arrived On Scene" : "🚑 Ambulance Dispatched & En Route"}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-dark-300">
          <span>Security Pass Code</span>
          <span className="text-cyan-400 font-bold">•</span>
          <span className="text-dark-400">Valid for {formattedTime}</span>
        </div>
      </div>

      {/* Ambulance Identity Bar */}
      <div className="p-4 rounded-2xl bg-dark-950/80 border border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-dark-400 font-bold">
              Assigned Emergency Unit
            </div>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="font-mono bg-dark-800 px-2 py-0.5 rounded border border-dark-600 text-cyan-300">
                {plateNumber}
              </span>
              <span className="text-xs font-normal text-dark-400">({ambulanceType})</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-right sm:self-center">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
            {isArrived ? "AWAITING CODE" : "ON WAY TO YOU"}
          </span>
        </div>
      </div>

      {/* Center Section: 4-Digit OTP Display */}
      <div className="text-center space-y-3 pt-2">
        <h3 className="text-lg sm:text-xl font-black text-white flex items-center justify-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          <span>Arrival Verification OTP</span>
        </h3>
        <p className="text-xs sm:text-sm text-dark-300 max-w-md mx-auto">
          {isArrived
            ? `Verbally share this 4-digit code with the driver of ${plateNumber} now to confirm your identity.`
            : `Keep this code ready. Share it verbally with the driver of ${plateNumber} when they arrive.`}
        </p>

        {/* The 4-digit Digits */}
        <div className="py-2">
          <div className="inline-flex items-center justify-center gap-3 sm:gap-4 select-all">
            {String(otp)
              .split("")
              .map((digit, idx) => (
                <div
                  key={idx}
                  className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-dark-950 border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center text-3xl sm:text-4xl font-black font-mono text-cyan-300"
                >
                  {digit}
                </div>
              ))}
          </div>
        </div>

        {/* Copy Button */}
        <div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs font-mono text-dark-300 hover:text-white transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code ({otp})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="p-3.5 rounded-xl bg-dark-950/80 border border-dark-700 max-w-md mx-auto text-xs text-dark-300 flex items-center justify-center space-x-2 text-center">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Do not share this code over phone. Only provide in-person to the arriving paramedic.</span>
      </div>
    </div>
  );
};

export default OTPDisplay;
