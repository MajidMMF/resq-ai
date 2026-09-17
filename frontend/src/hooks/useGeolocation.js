import { useState, useEffect } from "react";

export const useGeolocation = (options = { enableHighAccuracy: true }) => {
  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: null,
    error: null,
    loading: true,
  });

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          error: null,
          loading: false,
        });
      },
      (err) => {
        setLocation((prev) => ({
          ...prev,
          error: err.message,
          loading: false,
        }));
      },
      options
    );
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  return { ...location, refreshLocation };
};

export default useGeolocation;

