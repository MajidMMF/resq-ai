import React, { useState, useEffect } from "react";
import {
  useGetMyHospitalQuery,
  useUpdateHospitalProfileMutation,
} from "../../features/hospitals/hospitalsApi";
import useAuth from "../../hooks/useAuth";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import {
  Hospital,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  User,
  Save,
  Loader2,
  CheckCircle2,
  Crosshair,
  Map as MapIcon,
} from "lucide-react";
import { toast } from "sonner";
import HospitalLocationModal from "../../components/hospital/HospitalLocationModal";

export const HospitalSettings = () => {
  const { user } = useAuth();
  const { data: hospitalData, isLoading, refetch } = useGetMyHospitalQuery();
  const [updateHospitalProfile, { isLoading: isSaving }] = useUpdateHospitalProfileMutation();

  const hospital = hospitalData?.data?.hospital || hospitalData?.hospital || hospitalData?.data || {};
  const staff = hospitalData?.data?.staff || hospitalData?.staff || {};

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("24/7 Continuous Trauma ER");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSyncingGps, setIsSyncingGps] = useState(false);

  useEffect(() => {
    if (hospital) {
      if (hospital.name) setName(hospital.name);
      if (hospital.phone) setPhone(hospital.phone);
      if (hospital.address) setAddress(hospital.address);
      if (hospital.operatingHours) setOperatingHours(hospital.operatingHours);
    }
  }, [hospital]);

  const handleQuickGpsSync = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsSyncingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          let addressName = "";
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              addressName = geoData.display_name || "";
            }
          } catch (e) {}

          await updateHospitalProfile({
            latitude: lat,
            longitude: lng,
            ...(addressName ? { address: addressName } : {}),
          }).unwrap();

          toast.success("Hospital GPS Location Synchronized!", {
            description: addressName
              ? addressName.split(",").slice(0, 3).join(",")
              : `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
          });
          refetch();
        } catch (err) {
          toast.error("Failed to sync GPS location");
        } finally {
          setIsSyncingGps(false);
        }
      },
      (err) => {
        setIsSyncingGps(false);
        toast.error(`GPS Error: ${err.message}. You can pick location manually on the map.`);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateHospitalProfile({
        name,
        phone,
        address,
        operatingHours,
      }).unwrap();
      toast.success("Facility contact and profile information updated!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={3} className="h-36" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. HERO HEADER */}
      <div className="p-6 sm:p-8 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center text-3xl">
            🏥
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-white">{hospital?.name || "Apex Trauma ER"}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                ACCREDITED
              </span>
            </div>
            <p className="text-xs text-dark-400 font-mono mt-1">
              Apex Trauma Center (Level 1) • Verified ResQ Health Grid Node
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-dark-950 border border-dark-800 text-xs font-mono text-dark-300">
          <span className="text-dark-500 block text-[10px]">FACILITY STATUS</span>
          <span className="text-emerald-400 font-bold">ACTIVE & DISPATCH-READY</span>
        </div>
      </div>

      {/* 2. PROFILE EDIT FORM */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-5">
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Hospital Operational Information
          </h2>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emergency-600/20 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-dark-400 uppercase text-[10px] block mb-1.5">
              Hospital Facility Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-white focus:outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          <div>
            <label className="text-dark-400 uppercase text-[10px] block mb-1.5">
              Emergency Trauma Hotline
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-white focus:outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-dark-400 uppercase text-[10px] block font-mono">
                Physical Street Address & Map Location
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-dark-950 hover:bg-dark-800 border border-dark-700 text-[11px] font-bold text-cyan-400 flex items-center space-x-1 transition"
                >
                  <MapIcon className="w-3 h-3" />
                  <span>Pick on Map</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickGpsSync}
                  disabled={isSyncingGps}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 flex items-center space-x-1 transition disabled:opacity-50"
                >
                  {isSyncingGps ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Crosshair className="w-3 h-3" />
                  )}
                  <span>Auto-Detect GPS</span>
                </button>
              </div>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-white focus:outline-none focus:border-cyan-400 transition"
              required
            />
            {hospital?.location?.coordinates && (
              <p className="text-[11px] text-dark-400 font-mono">
                Current Pin: Lat {hospital.location.coordinates[1]?.toFixed(5)}, Lng {hospital.location.coordinates[0]?.toFixed(5)}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-dark-400 uppercase text-[10px] block mb-1.5">
              Operating Hours & Trauma Protocol
            </label>
            <input
              type="text"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
        </div>
      </form>

      {/* 3. LOGGED-IN STAFF CREDENTIALS */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
        <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
          <User className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Active Duty Medical Staff
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
            <span className="text-dark-500 block text-[10px] uppercase">Staff Officer</span>
            <span className="text-white font-bold mt-1 block">{user?.name || "Dr. Medical Lead"}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
            <span className="text-dark-500 block text-[10px] uppercase">Verified Email</span>
            <span className="text-slate-200 mt-1 block truncate">{user?.email || "staff@resq.ai"}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
            <span className="text-dark-500 block text-[10px] uppercase">Role Authorization</span>
            <span className="text-emerald-400 font-bold mt-1 block">HOSPITAL_STAFF_LEVEL_1</span>
          </div>
        </div>
      </div>

      {/* HOSPITAL LOCATION PICKER MODAL */}
      <HospitalLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentHospital={hospital}
        onSuccess={refetch}
      />
    </div>
  );
};

export default HospitalSettings;

