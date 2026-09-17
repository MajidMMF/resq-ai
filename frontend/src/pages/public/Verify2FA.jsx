import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "../../features/auth/authApi";
import { setUser } from "../../features/auth/authSlice";
import { getRedirectPath } from "../../lib/constants";
import ResQLogo from "../../components/shared/ResQLogo";
import OTPInput from "../../components/shared/OTPInput";
import { cardEnter, shake } from "../../lib/gsap";
import { toast } from "sonner";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

export const Verify2FA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cardRef = useRef(null);

  const email = location.state?.email || sessionStorage.getItem("resq_2fa_email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes total
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    cardEnter(cardRef.current);
    if (!email) {
      toast.error("Session expired or missing. Please log in.");
      navigate("/login", { replace: true });
    } else {
      sessionStorage.setItem("resq_2fa_email", email);
    }
  }, [email, navigate]);

  // Overall 10-minute timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 60-second resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cdTimer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(cdTimer);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      shake(cardRef.current);
      return;
    }

    try {
      const res = await verifyOtp({
        email,
        otp: code,
      }).unwrap();

      if (res?.data?.user) {
        dispatch(setUser(res.data.user));
        sessionStorage.removeItem("resq_2fa_email");
        toast.success("Identity verified successfully");
        navigate(getRedirectPath(res.data.user.roles), { replace: true });
      }
    } catch (err) {
      shake(cardRef.current);
      setOtp(["", "", "", "", "", ""]);
      const msg = err?.data?.message || "Invalid or expired OTP code";
      toast.error(msg);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      await resendOtp({ email }).unwrap();
      toast.success("A new verification code has been dispatched");
      setResendCooldown(60);
      setTimeLeft(600);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      toast.error(err?.data?.message || "Could not resend code. Please wait.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div
        ref={cardRef}
        className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Verify Your Identity</h2>
          <p className="text-sm text-dark-400 mt-1 max-w-xs">
            Enter the 6-digit security code sent to <br />
            <span className="text-slate-200 font-medium">{email}</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* OTP input boxes */}
          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
            disabled={isVerifying}
            onComplete={(code) => handleVerify(code)}
          />

          {/* Timers & Resend Action */}
          <div className="flex items-center justify-between text-xs text-dark-400 pt-2 border-t border-dark-700">
            <span>
              Expires in:{" "}
              <span className="font-mono text-cyan-400 font-medium">
                {formatTime(timeLeft)}
              </span>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="text-cyan-400 hover:text-cyan-300 font-medium disabled:text-dark-500 disabled:cursor-not-allowed transition"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : isResending
                ? "Sending..."
                : "Resend Code"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isVerifying || otp.join("").length < 6}
            className="w-full bg-gradient-to-r from-emergency-600 to-emergency-500 text-white font-semibold rounded-xl py-3 text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2 shadow-lg shadow-emergency-600/30"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1 text-xs text-dark-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Verify2FA;

