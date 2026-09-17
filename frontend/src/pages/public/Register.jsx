import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../../features/auth/authApi";
import { setUser } from "../../features/auth/authSlice";
import { getRedirectPath } from "../../lib/constants";
import ResQLogo from "../../components/shared/ResQLogo";
import PasswordInput from "../../components/shared/PasswordInput";
import { cardEnter, shake } from "../../lib/gsap";
import { toast } from "sonner";
import { User, Ambulance, Building2, Loader2, MapPin } from "lucide-react";

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [role, setRole] = useState("USER");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    // Ambulance specifics
    plateNumber: "",
    ambulanceType: "basic",
    // Hospital specifics
    hospitalName: "",
    hospitalAddress: "",
    hospitalPhone: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});
  const [register, { isLoading }] = useRegisterMutation();

  useEffect(() => {
    cardEnter(cardRef.current);
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.info("Fetching GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success("GPS Location acquired");
      },
      (err) => toast.error("Could not fetch location: " + err.message)
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";

    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Min 6 characters";

    if (!form.mobile.trim()) errs.mobile = "Mobile number is required";

    if (role === "AMBULANCE_DRIVER") {
      if (!form.plateNumber.trim()) errs.plateNumber = "Vehicle plate number required";
    }

    if (role === "HOSPITAL_STAFF") {
      if (!form.hospitalName.trim()) errs.hospitalName = "Hospital name required";
      if (!form.hospitalAddress.trim()) errs.hospitalAddress = "Hospital address required";
      if (!form.hospitalPhone.trim()) errs.hospitalPhone = "Emergency phone required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      shake(cardRef.current);
      return;
    }

    const payload = {
      role,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      mobile: form.mobile.trim(),
    };

    if (role === "AMBULANCE_DRIVER") {
      payload.ambulance = {
        plateNumber: form.plateNumber.trim().toUpperCase(),
        type: form.ambulanceType,
      };
    }

    if (role === "HOSPITAL_STAFF") {
      payload.hospital = {
        name: form.hospitalName.trim(),
        phone: form.hospitalPhone.trim(),
        address: {
          street: form.hospitalAddress.trim(),
          city: "Metro City",
        },
      };
      if (form.latitude && form.longitude) {
        payload.hospital.location = {
          type: "Point",
          coordinates: [parseFloat(form.longitude), parseFloat(form.latitude)],
        };
      }
    }

    try {
      const res = await register(payload).unwrap();

      if (res?.data?.needs2FA) {
        toast.info("Account created. Please verify 2FA.");
        navigate("/verify-2fa", { state: { email: form.email.trim() } });
        return;
      }

      if (res?.data?.user) {
        dispatch(setUser(res.data.user));
        toast.success("Account registered successfully!");
        navigate(getRedirectPath(res.data.user.roles), { replace: true });
      } else {
        toast.success("Registration complete. Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      shake(cardRef.current);
      const msg = err?.data?.message || "Registration failed. Try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div
        ref={cardRef}
        className="w-full max-w-lg bg-dark-800 border border-dark-600 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 my-6"
      >
        <div className="flex flex-col items-center mb-6">
          <ResQLogo className="w-12 h-12 mb-2" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-sm text-dark-400 mt-0.5">Join the ResQ AI Emergency Network</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "USER", label: "Citizen / User", icon: User },
              { id: "AMBULANCE_DRIVER", label: "Ambulance", icon: Ambulance },
              { id: "HOSPITAL_STAFF", label: "Hospital", icon: Building2 },
            ].map((item) => {
              const Icon = item.icon;
              const selected = role === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRole(item.id)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-white"
                      : "border-dark-600 bg-dark-700 text-dark-300 hover:border-dark-500"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${selected ? "text-cyan-400" : "text-dark-400"}`} />
                  <span className="text-xs font-semibold leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Fields */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. John Doe / Jane Smith"
              disabled={isLoading}
              className={`w-full bg-dark-700 border ${
                errors.name ? "border-emergency-500" : "border-dark-600"
              } rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none text-sm`}
            />
            {errors.name && <p className="text-xs text-emergency-400 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@domain.com"
                disabled={isLoading}
                className={`w-full bg-dark-700 border ${
                  errors.email ? "border-emergency-500" : "border-dark-600"
                } rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none text-sm`}
              />
              {errors.email && <p className="text-xs text-emergency-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+91 9876543210"
                disabled={isLoading}
                className={`w-full bg-dark-700 border ${
                  errors.mobile ? "border-emergency-500" : "border-dark-600"
                } rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none text-sm`}
              />
              {errors.mobile && <p className="text-xs text-emergency-400 mt-1">{errors.mobile}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
              Password
            </label>
            <PasswordInput
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              disabled={isLoading}
            />
            {errors.password && <p className="text-xs text-emergency-400 mt-1">{errors.password}</p>}
          </div>

          {/* Dynamic Role Fields: AMBULANCE DRIVER */}
          {role === "AMBULANCE_DRIVER" && (
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-600 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Ambulance Vehicle Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={form.plateNumber}
                    onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                    placeholder="DL-01-AB-1234"
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-sm text-slate-100 uppercase"
                  />
                  {errors.plateNumber && (
                    <p className="text-xs text-emergency-400 mt-1">{errors.plateNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Vehicle Type</label>
                  <select
                    value={form.ambulanceType}
                    onChange={(e) => setForm({ ...form, ambulanceType: e.target.value })}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="basic">Basic Life Support</option>
                    <option value="advanced">Advanced Life Support</option>
                    <option value="icu">ICU on Wheels</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Role Fields: HOSPITAL STAFF */}
          {role === "HOSPITAL_STAFF" && (
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-600 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Hospital Institution Details
              </h4>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  placeholder="St. Jude Emergency Center"
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-sm text-slate-100"
                />
                {errors.hospitalName && (
                  <p className="text-xs text-emergency-400 mt-1">{errors.hospitalName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Address / Street</label>
                  <input
                    type="text"
                    value={form.hospitalAddress}
                    onChange={(e) => setForm({ ...form, hospitalAddress: e.target.value })}
                    placeholder="12 Ring Road"
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  {errors.hospitalAddress && (
                    <p className="text-xs text-emergency-400 mt-1">{errors.hospitalAddress}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Emergency Desk Phone</label>
                  <input
                    type="tel"
                    value={form.hospitalPhone}
                    onChange={(e) => setForm({ ...form, hospitalPhone: e.target.value })}
                    placeholder="+91 11 2345678"
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  {errors.hospitalPhone && (
                    <p className="text-xs text-emergency-400 mt-1">{errors.hospitalPhone}</p>
                  )}
                </div>
              </div>

              {/* Coordinates button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-500 text-xs font-medium text-cyan-400 hover:bg-dark-600 transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Auto-detect Hospital GPS</span>
                </button>
                {form.latitude && (
                  <span className="text-xs text-dark-400 font-mono">
                    {form.latitude}, {form.longitude}
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-emergency-600 to-emergency-500 text-white font-semibold rounded-xl py-3 text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2 shadow-lg shadow-emergency-600/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-dark-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

