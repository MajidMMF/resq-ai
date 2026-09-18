import React from "react";
import { Outlet } from "react-router-dom";
import AmbulanceTopbar from "./AmbulanceTopbar";
import AmbulanceBottomNav from "./AmbulanceBottomNav";
import PageTransition from "./PageTransition";
import {
  useGetMyAmbulanceQuery,
  useUpdateAmbulanceStatusMutation,
  useUpdateAmbulanceLocationMutation,
} from "../../features/ambulances/ambulancesApi";
import useGeolocation from "../../hooks/useGeolocation";
import { toast } from "sonner";

export const AmbulanceLayout = () => {
  const { data: ambData, refetch } = useGetMyAmbulanceQuery(undefined, {
    pollingInterval: 8000,
  });

  const raw = ambData?.data || ambData || null;
  const ambulance = raw?.ambulance || raw;
  const isOnline = ambulance?.status === "online" || ambulance?.status === "busy";

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAmbulanceStatusMutation();
  const [updateLocation] = useUpdateAmbulanceLocationMutation();

  const { latitude, longitude } = useGeolocation();

  // Background driver GPS reporting to ambulance-service
  // Background driver GPS reporting to ambulance-service (heartbeat every 15s)
  React.useEffect(() => {
    if (isOnline && latitude && longitude) {
      updateLocation({
        latitude,
        longitude,
      }).catch(() => {});
    }
    if (!isOnline) return;

    const reportPos = () => {
      if (latitude && longitude) {
        updateLocation({
          latitude,
          longitude,
        }).catch(() => {});
      }
    };

    reportPos();
    const interval = setInterval(reportPos, 15000);
    return () => clearInterval(interval);
  }, [isOnline, latitude, longitude, updateLocation]);

  const handleToggleStatus = async () => {
    const nextStatus = isOnline ? "offline" : "online";
    try {
      await updateStatus(nextStatus).unwrap();
      toast.success(`Unit status updated to ${nextStatus.toUpperCase()}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Top Telematics Bar */}
      <AmbulanceTopbar
        ambulance={ambulance}
        isOnline={isOnline}
        onToggleStatus={handleToggleStatus}
        isUpdating={isUpdatingStatus}
      />

      {/* Main Routed Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 max-w-6xl mx-auto w-full">
        <PageTransition>
          <Outlet context={{ ambulance, isOnline, refetchAmbulance: refetch }} />
        </PageTransition>
      </main>

      {/* Mobile Driver Navigation */}
      <AmbulanceBottomNav />
    </div>
  );
};

export default AmbulanceLayout;

