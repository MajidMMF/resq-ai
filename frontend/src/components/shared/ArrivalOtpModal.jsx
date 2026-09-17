import React, { useState } from "react";
import OTPInput from "../shared/OTPInput";
import { KeyRound, ShieldAlert, X, Loader2 } from "lucide-react";

export const ArrivalOtpModal = ({
  isOpen,
  onClose,
  onVerify,
  isVerifying = false,
  attemptsLeft = 3,
}) => {
  const [otp, setOtp] = useState(["", "", "", ""]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length === 4) {
      onVerify(code);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-dark-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-dark-900 border-2 border-emergency-500 shadow-2xl shadow-emergency-950/80 space-y-5 text-center relative my-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-dark-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emergency-600/20 border border-emergency-500/40 flex items-center justify-center text-emergency-400 mx-auto">
          <KeyRound className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-xl font-black text-white">Enter Arrival Verification OTP</h3>
          <p className="text-xs text-dark-300 mt-1 max-w-xs mx-auto">
            Ask the patient or bystander for the 4-digit security code displayed on their phone.
          </p>
        </div>

        {/* 4-digit OTP Input */}
        <div className="py-2">
          <OTPInput
            length={4}
            value={otp}
            onChange={setOtp}
            disabled={isVerifying}
            onComplete={(code) => onVerify(code)}
          />
        </div>

        {attemptsLeft < 3 && (
          <p className="text-xs text-emergency-400 font-mono font-bold">
            ⚠ {attemptsLeft} verification attempt(s) remaining!
          </p>
        )}

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="flex-1 py-3 rounded-xl border border-dark-600 hover:bg-dark-800 text-xs font-bold text-dark-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isVerifying || otp.join("").length < 4}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emergency-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Confirm & Start Trip</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArrivalOtpModal;

