import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Crosshair,
  Search,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { useUpdateHospitalProfileMutation } from "../../features/hospitals/hospitalsApi";

// Hospital Icon for the picker marker
const pickerIcon = L.divIcon({
  className: "hospital-picker-pin",
  html: `
    <div class="relative flex items-center justify-center w-11 h-11">
      <span class="absolute w-10 h-10 rounded-full bg-emergency-500/30 animate-ping"></span>
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emergency-600 to-rose-500 border-2 border-white shadow-2xl flex items-center justify-center text-white text-base font-black">
        🏥
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Helper component to handle user clicking on map
function MapClickObserver({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper component to smooth pan/fly to selected location
function MapFlyController({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export const HospitalLocationModal = ({
  isOpen,
  onClose,
  currentHospital = {},
  onSuccess,
}) => {
  const [updateHospitalProfile, { isLoading: isSaving }] = useUpdateHospitalProfileMutation();

  // Initial coords (default Hyderabad or current hospital location)
  const initialLat = currentHospital?.location?.coordinates?.[1] || 17.4773742;
  const initialLng = currentHospital?.location?.coordinates?.[0] || 78.5723865;
  const initialAddress = currentHospital?.address || "";

  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const curLat = currentHospital?.location?.coordinates?.[1] || 17.4773742;
      const curLng = currentHospital?.location?.coordinates?.[0] || 78.5723865;
      setLat(curLat);
      setLng(curLng);
      setAddress(currentHospital?.address || "");
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, currentHospital]);

  // Reverse geocode lat/lng to readable address
  const fetchAddressFromCoords = async (latitude, longitude) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // When user clicks anywhere on the map
  const handleMapClick = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    fetchAddressFromCoords(newLat, newLng);
  };

  // Search places via Nominatim
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5&countrycodes=in&addressdetails=1`
        );
        if (res.ok) {
          const results = await res.json();
          setSearchResults(results || []);
        }
      } catch (err) {
        console.warn("Search query failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  // Select a search result
  const handleSelectSearchResult = (result) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setLat(newLat);
      setLng(newLng);
      setAddress(result.display_name || "");
      setSearchResults([]);
      setSearchQuery(result.display_name.split(",")[0] || "");
    }
  };

  // Auto-detect GPS from browser/mobile
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        setLat(currentLat);
        setLng(currentLng);
        await fetchAddressFromCoords(currentLat, currentLng);
        setIsGpsLoading(false);
        toast.success("Live device GPS coordinates detected!");
      },
      (err) => {
        setIsGpsLoading(false);
        toast.error(`GPS Error: ${err.message || "Location access denied"}. Please pick location manually on the map.`);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Save hospital location
  const handleSaveLocation = async () => {
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid coordinates. Please pick a location on the map.");
      return;
    }

    try {
      await updateHospitalProfile({
        latitude: lat,
        longitude: lng,
        address: address || currentHospital?.address || "Emergency Trauma Center",
      }).unwrap();

      toast.success("Hospital location successfully updated & saved!", {
        description: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update hospital location:", err);
      toast.error(err?.data?.error || "Failed to save hospital location");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-dark-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center text-emergency-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Set Hospital Facility Location
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  Interactive Map
                </span>
              </h2>
              <p className="text-xs text-dark-400">
                Pick on map, search address, or auto-detect device GPS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & GPS CONTROLS */}
        <div className="p-4 sm:p-6 border-b border-dark-800 bg-dark-900/90 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search area, road, landmark (e.g. Bhavani Nagar, Secunderabad)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-950 border border-dark-700 text-xs sm:text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition"
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
              )}

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-[1000] bg-dark-950 border border-dark-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-dark-800">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="p-3 hover:bg-dark-800/80 cursor-pointer transition text-left"
                    >
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emergency-400 shrink-0" />
                        <span className="truncate">{item.display_name.split(",")[0]}</span>
                      </div>
                      <p className="text-[11px] text-dark-400 truncate mt-0.5">
                        {item.display_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={isGpsLoading}
              className="px-4 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50 shrink-0"
            >
              {isGpsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4 text-cyan-400" />
              )}
              <span>Auto-Detect Live GPS</span>
            </button>
          </div>

          <p className="text-[11px] text-dark-400 flex items-center gap-1.5">
            <span className="text-emergency-400 font-bold">Tip:</span>
            <span>You can click anywhere on the map below to drop the hospital pin at your exact entrance or bay.</span>
          </p>
        </div>

        {/* INTERACTIVE MAP */}
        <div className="flex-1 min-h-[280px] sm:min-h-[340px] relative">
          <LeafletMap
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-tiles"
              maxZoom={19}
            />
            <MapClickObserver onPick={handleMapClick} />
            <MapFlyController center={[lat, lng]} zoom={16} />

            <Marker position={[lat, lng]} icon={pickerIcon}>
              <Popup>
                <div className="p-1 min-w-[160px] font-sans">
                  <p className="font-bold text-xs text-white">
                    {currentHospital?.name || "Hospital Facility"}
                  </p>
                  <p className="text-[10px] text-dark-400 font-mono mt-0.5">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </LeafletMap>

          {/* Coordinate Badge Overlay on Map */}
          <div className="absolute bottom-3 left-3 z-[400] bg-dark-950/85 backdrop-blur-md border border-dark-700 px-3 py-1.5 rounded-xl text-[11px] font-mono text-cyan-400 flex items-center space-x-2">
            <Navigation className="w-3.5 h-3.5 text-emergency-500" />
            <span>
              Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
            </span>
            {isReverseGeocoding && (
              <Loader2 className="w-3 h-3 animate-spin text-dark-400" />
            )}
          </div>
        </div>

        {/* ADDRESS PREVIEW & MANUAL COORDINATE OVERRIDES */}
        <div className="p-4 sm:p-6 bg-dark-950 border-t border-dark-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-dark-400 block mb-1">
                Resolved Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Hospital building, street, area, city..."
                className="w-full px-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-dark-400 block mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-dark-400 block mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-bold text-dark-300 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveLocation}
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emergency-600/30 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Hospital Location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HospitalLocationModal;

