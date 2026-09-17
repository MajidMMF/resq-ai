import { env } from "../config/env.js";
import { getCache, setCache, cacheKeys } from "../utils/cache.js";
import { calculateDistanceMeters, calculateDistanceKm, estimateDurationSeconds } from "../utils/haversine.js";

const OSRM_TIMEOUT_MS = 7000;
const CACHE_TTL_ROUTE = 300; // 5 minutes

/**
 * Calculates a driving route between two points using OSRM.
 *
 * @param {Object} from - { lat, lng }
 * @param {Object} to - { lat, lng }
 * @returns {Promise<Object>} Route details including distance, duration, geometry, and steps
 */
export async function calculateRoute(from, to) {
  const fromLat = Number(from.lat);
  const fromLng = Number(from.lng);
  const toLat = Number(to.lat);
  const toLng = Number(to.lng);

  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    throw new Error("Invalid route coordinates");
  }

  const cacheKey = cacheKeys.route({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng });

  // 1. Check Redis Cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return { ...cached, source: "cache" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

    // OSRM format: /route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=polyline&steps=true
    const coordinatesPath = `${fromLng},${fromLat};${toLng},${toLat}`;
    const url = `${env.OSRM_URL}/route/v1/driving/${coordinatesPath}?overview=full&geometries=polyline&steps=true&annotations=true`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      const leg = primaryRoute.legs?.[0] || {};

      const result = {
        distanceMeters: Math.round(primaryRoute.distance),
        distanceKm: Math.round((primaryRoute.distance / 1000) * 10) / 10,
        durationSeconds: Math.round(primaryRoute.duration),
        durationMinutes: Math.round(primaryRoute.duration / 60),
        geometry: primaryRoute.geometry, // Encoded polyline string readable by Leaflet
        steps: (leg.steps || []).map((step) => ({
          instruction: step.maneuver?.type || "continue",
          modifier: step.maneuver?.modifier || "",
          name: step.name || "unnamed road",
          distanceMeters: Math.round(step.distance),
          durationSeconds: Math.round(step.duration),
        })),
        waypoints: (data.waypoints || []).map((wp) => ({
          name: wp.name,
          location: wp.location, // [lng, lat]
        })),
        source: "osrm",
        isFallback: false,
      };

      // Cache route in Redis (5 min TTL)
      await setCache(cacheKey, result, CACHE_TTL_ROUTE);
      return result;
    }

    // Fallback if OSRM returns non-Ok
    return getFallbackRoute(fromLat, fromLng, toLat, toLng);
  } catch (error) {
    console.warn("OSRM routing request failed:", error.message);
    return getFallbackRoute(fromLat, fromLng, toLat, toLng);
  }
}

/**
 * Quick distance & ETA computation (uses haversine + OSRM shortcut)
 */
export async function calculateDistanceAndEta(from, to) {
  const fromLat = Number(from.lat);
  const fromLng = Number(from.lng);
  const toLat = Number(to.lat);
  const toLng = Number(to.lng);

  const straightMeters = calculateDistanceMeters(fromLat, fromLng, toLat, toLng);
  const straightKm = calculateDistanceKm(fromLat, fromLng, toLat, toLng);
  const estimatedSec = estimateDurationSeconds(straightMeters);

  // Try to get high-accuracy route from cache or service
  try {
    const route = await calculateRoute(from, to);
    return {
      distanceMeters: route.distanceMeters,
      distanceKm: route.distanceKm,
      durationSeconds: route.durationSeconds,
      durationMinutes: route.durationMinutes,
      source: route.source,
      isFallback: route.isFallback,
    };
  } catch {
    return {
      distanceMeters: straightMeters,
      distanceKm: straightKm,
      durationSeconds: estimatedSec,
      durationMinutes: Math.max(1, Math.round(estimatedSec / 60)),
      source: "haversine_estimate",
      isFallback: true,
    };
  }
}

/* ──────────────────────────────────────────
   FALLBACK ROUTE GENERATOR
   ────────────────────────────────────────── */

function getFallbackRoute(lat1, lon1, lat2, lon2) {
  const distanceMeters = calculateDistanceMeters(lat1, lon1, lat2, lon2);
  const durationSeconds = estimateDurationSeconds(distanceMeters);

  // Simple encoded polyline representation for straight line between points
  // Encoded polyline for the two endpoints
  return {
    distanceMeters,
    distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
    durationSeconds,
    durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    geometry: encodeSimplePolyline([[lat1, lon1], [lat2, lon2]]),
    coordinates: [
      [lat1, lon1],
      [lat2, lon2],
    ],
    steps: [
      {
        instruction: "Depart from current location",
        name: "Emergency Route",
        distanceMeters,
        durationSeconds,
      },
      {
        instruction: "Arrive at destination",
        name: "Emergency Destination",
        distanceMeters: 0,
        durationSeconds: 0,
      },
    ],
    source: "haversine_fallback",
    isFallback: true,
  };
}

/**
 * Encodes an array of [lat, lng] pairs into a standard Google/OSRM Polyline string
 */
function encodeSimplePolyline(points) {
  let encoded = "";
  let plat = 0;
  let plng = 0;

  for (const point of points) {
    const lat = Math.round(point[0] * 1e5);
    const lng = Math.round(point[1] * 1e5);

    encoded += encodeSignedNumber(lat - plat);
    encoded += encodeSignedNumber(lng - plng);

    plat = lat;
    plng = lng;
  }

  return encoded;
}

function encodeSignedNumber(num) {
  let sgn_num = num << 1;
  if (num < 0) {
    sgn_num = ~sgn_num;
  }
  return encodeNumber(sgn_num);
}

function encodeNumber(num) {
  let encodeString = "";
  while (num >= 0x20) {
    encodeString += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  encodeString += String.fromCharCode(num + 63);
  return encodeString;
}

export default {
  calculateRoute,
  calculateDistanceAndEta,
};

