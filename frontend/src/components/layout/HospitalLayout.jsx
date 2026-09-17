import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import HospitalSidebar from "./HospitalSidebar";
import HospitalTopbar from "./HospitalTopbar";
import HospitalBottomNav from "./HospitalBottomNav";
import PageTransition from "./PageTransition";
import { pageEnter } from "../../lib/gsap";
import {
  useUpdateHospitalProfileMutation,
  useGetMyHospitalQuery,
} from "../../features/hospitals/hospitalsApi";
import { toast } from "sonner";

export const HospitalLayout = () => {
  const contentRef = useRef(null);
  const [updateHospitalProfile] = useUpdateHospitalProfileMutation();
  const { data: hospitalData, refetch } = useGetMyHospitalQuery();
  const hasSyncedLocation = useRef(false);

  useEffect(() => {
    pageEnter(contentRef.current);
  }, []);

  // Automatically request and synchronize hospital GPS location on device if not yet set
  useEffect(() => {
    if (hasSyncedLocation.current) return;

    // If hospital already has a configured address and coordinates, don't overwrite on load
    const hospital = hospitalData?.data?.hospital || hospitalData?.hospital;
    if (hospital?.address && hospital?.location?.coordinates?.length === 2) {
      hasSyncedLocation.current = true;
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        hasSyncedLocation.current = true;
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
          console.warn("Failed to sync hospital location:", err);
        }
      },
      (err) => {
        hasSyncedLocation.current = true;
        console.warn("Location permission not granted:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [hospitalData, updateHospitalProfile, refetch]);

  return (
    <div className="flex h-screen bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Desktop Left Sidebar */}
      <HospitalSidebar />

      {/* 2. Main Center Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HospitalTopbar />

        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8"
        >
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation */}
      <HospitalBottomNav />
    </div>
  );
};

export default HospitalLayout;

