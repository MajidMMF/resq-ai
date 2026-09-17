import { useState, useEffect } from "react";

/**
 * Custom hook to reverse geocode lat/lng coordinates into a human-readable place name.
 * Calls backend location-service (/api/locations/reverse-geocode) through API Gateway.
 */
export const useReverseGeocode = (lat, lng) => {
  const [address, setAddress] = useState(null);
  const [placeName, setPlaceName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      setAddress(null);
      setPlaceName(null);
      return;
    }

    const numericLat = Number(lat);
    const numericLng = Number(lng);

    if (isNaN(numericLat) || isNaN(numericLng)) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Call backend location service reverse geocode endpoint
    fetch("/api/locations/reverse-geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat: numericLat, lng: numericLng }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const loc = data?.data;
        if (loc) {
          // Format a human-friendly place name (e.g. "Banjara Hills, Hyderabad" or "Sultan Bazar, Hyderabad")
          const parts = [
            loc.suburb || loc.road || loc.rawAddress?.neighbourhood || loc.rawAddress?.suburb,
            loc.city || loc.rawAddress?.city || loc.state,
          ].filter(Boolean);

          const shortName = parts.length > 0 ? parts.join(", ") : (loc.city || loc.displayName?.split(",")[0] || "Identified Location");
          setPlaceName(shortName);
          setAddress(loc.displayName || shortName);
        } else {
          setPlaceName("Detected GPS Location");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Reverse geocoding failed:", err.message);
        setError(err.message);
        setPlaceName("Detected GPS Location");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  return { placeName, address, loading, error };
};

export default useReverseGeocode;

