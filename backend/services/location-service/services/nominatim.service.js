import { env } from "../config/env.js";
import { getCache, setCache, cacheKeys } from "../utils/cache.js";
import { checkRateLimit } from "../utils/rateLimit.js";

const NOMINATIM_TIMEOUT_MS = 6000;
const CACHE_TTL_GEOCODE = 86400; // 24 hours
const CACHE_TTL_AUTOCOMPLETE = 3600; // 1 hour

/**
 * Forward Geocoding: Converts an address string into lat/lng coordinates.
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== "string") {
    throw new Error("Address string is required");
  }

  const trimmed = address.trim();
  const cacheKey = cacheKeys.geocode(trimmed);

  // 1. Check Redis Cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" };
  }

  // 2. Check Nominatim rate limit (1 request/sec max per TOS)
  const allowed = await checkRateLimit("ratelimit:loc:nominatim", 1, 1);
  if (!allowed) {
    console.warn("Nominatim rate-limit reached; using cached or fallback geocode");
    return getFallbackGeocode(trimmed);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

    const url = new URL(`${env.NOMINATIM_URL}/search`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": env.USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Nominatim error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const best = data[0];
      const result = {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
        displayName: best.display_name,
        type: best.type || "place",
        importance: best.importance || 0,
        address: best.address || {},
        source: "nominatim",
      };

      // Cache result in Redis (24 hours)
      await setCache(cacheKey, result, CACHE_TTL_GEOCODE);
      return result;
    }

    // No OSM match found → return fallback
    return getFallbackGeocode(trimmed);
  } catch (error) {
    console.warn("Nominatim geocode failed:", error.message);
    return getFallbackGeocode(trimmed);
  }
}

/**
 * Reverse Geocoding: Converts lat/lng coordinates into a human-readable address.
 */
export async function reverseGeocodeCoords(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);

  if (isNaN(nLat) || isNaN(nLng)) {
    throw new Error("Valid latitude and longitude are required");
  }

  const cacheKey = cacheKeys.reverseGeocode(nLat, nLng);

  // 1. Check Redis Cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" };
  }

  // 2. Check rate limit
  const allowed = await checkRateLimit("ratelimit:loc:nominatim", 1, 1);
  if (!allowed) {
    return getFallbackReverseGeocode(nLat, nLng);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

    const url = new URL(`${env.NOMINATIM_URL}/reverse`);
    url.searchParams.set("lat", String(nLat));
    url.searchParams.set("lon", String(nLng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": env.USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Nominatim reverse error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      const result = {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        displayName: data.display_name,
        road: data.address?.road || data.address?.pedestrian || "",
        suburb: data.address?.suburb || data.address?.neighbourhood || "",
        city: data.address?.city || data.address?.town || data.address?.state_district || "",
        state: data.address?.state || "",
        postcode: data.address?.postcode || "",
        country: data.address?.country || "",
        rawAddress: data.address || {},
        source: "nominatim",
      };

      await setCache(cacheKey, result, CACHE_TTL_GEOCODE);
      return result;
    }

    return getFallbackReverseGeocode(nLat, nLng);
  } catch (error) {
    console.warn("Nominatim reverse geocode failed:", error.message);
    return getFallbackReverseGeocode(nLat, nLng);
  }
}

/**
 * Autocomplete: Fast place search suggestions for UI search inputs.
 */
export async function autocompletePlaces(query) {
  if (!query || typeof query !== "string") {
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = cacheKeys.autocomplete(trimmed);

  // 1. Check Redis Cache
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

    const url = new URL(`${env.NOMINATIM_URL}/search`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": env.USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    const results = (Array.isArray(data) ? data : []).map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));

    if (results.length > 0) {
      await setCache(cacheKey, results, CACHE_TTL_AUTOCOMPLETE);
      return results;
    }

    return getFallbackAutocomplete(trimmed);
  } catch (error) {
    console.warn("Nominatim autocomplete failed:", error.message);
    return getFallbackAutocomplete(trimmed);
  }
}

/* ──────────────────────────────────────────
   FALLBACK HELPERS
   ────────────────────────────────────────── */

function getFallbackGeocode(address) {
  return {
    lat: 19.0760,
    lng: 72.8777,
    displayName: `${address}, Vicinity Area (Estimated location)`,
    type: "fallback",
    importance: 0.1,
    address: { road: address, city: "Emergency Zone" },
    source: "fallback",
    isFallback: true,
  };
}

function getFallbackReverseGeocode(lat, lng) {
  return {
    lat,
    lng,
    displayName: `Location near coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    road: "Emergency Corridor",
    city: "Metro Region",
    state: "Regional Area",
    postcode: "400001",
    country: "India",
    source: "fallback",
    isFallback: true,
  };
}

function getFallbackAutocomplete(query) {
  return [
    {
      displayName: `${query} Central Highway Road`,
      lat: 19.0760,
      lng: 72.8777,
      type: "highway",
      isFallback: true,
    },
    {
      displayName: `${query} Hospital & Trauma Junction`,
      lat: 19.0880,
      lng: 72.8850,
      type: "amenity",
      isFallback: true,
    },
  ];
}

export default {
  geocodeAddress,
  reverseGeocodeCoords,
  autocompletePlaces,
};

