import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../features/auth/authApi";
import { setUser } from "../../features/auth/authSlice";
import { getRedirectPath } from "../../lib/constants";
import ResQLogo from "../../components/shared/ResQLogo";
import PasswordInput from "../../components/shared/PasswordInput";
import { cardEnter, shake } from "../../lib/gsap";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const cardRef = useRef(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    cardEnter(cardRef.current);
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      shake(cardRef.current);
      return;
    }

    try {
      const res = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }).unwrap();

      if (res?.data?.needs2FA) {
        toast.info("2FA verification required");
        navigate("/verify-2fa", { state: { email: form.email.trim() } });
        return;
      }

      if (res?.data?.user) {
        dispatch(setUser(res.data.user));
        toast.success(`Welcome back, ${res.data.user.name || "User"}!`);

        const dest =
          location.state?.from?.pathname || getRedirectPath(res.data.user.roles);
        navigate(dest, { replace: true });
      }
    } catch (err) {
      shake(cardRef.current);
      const msg =
        err?.data?.message ||
        (err?.status === 401
          ? "Invalid email or password"
          : "Sign in failed. Please try again.");
      toast.error(msg);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div
        ref={cardRef}
        className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <ResQLogo className="w-12 h-12 mb-3" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-sm text-dark-400 mt-1">Sign in to continue to ResQ AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@domain.com"
              disabled={isLoading}
              className={`w-full bg-dark-700 border ${
                errors.email ? "border-emergency-500" : "border-dark-600"
              } rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition text-sm disabled:opacity-50`}
            />
            {errors.email && (
              <p className="text-xs text-emergency-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400">
                Password
              </label>
            </div>
            <PasswordInput
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-xs text-emergency-400 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-emergency-600 to-emergency-500 text-white font-semibold rounded-xl py-3 text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-600"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-800 px-3 text-dark-400 font-mono">OR</span>
          </div>
        </div>

        <p className="text-xs text-center text-dark-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
