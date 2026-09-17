import { env } from "../config/env.js";
import { getCache, setCache, cacheKeys } from "../utils/cache.js";
import { calculateDistanceMeters, calculateDistanceKm, estimateDurationSeconds } from "../utils/haversine.js";
import { getFallbackHospitals } from "../mock/mockHospitals.js";

const OVERPASS_TIMEOUT_MS = 8000;
const CACHE_TTL_HOSPITALS = 600; // 10 minutes

/**
 * Finds emergency hospitals and trauma centers within a given radius using Overpass API.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters (default: 5000m)
 * @returns {Promise<Array>} List of hospitals sorted by distance
 */
export async function findNearbyHospitals(lat, lng, radius = 5000) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  const nRadius = Number(radius) || 5000;

  if (isNaN(nLat) || isNaN(nLng)) {
    throw new Error("Valid coordinates are required");
  }

  const cacheKey = cacheKeys.hospitals(nLat, nLng, nRadius);

  // 1. Check Redis Cache
  const cached = await getCache(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached.map((h) => ({ ...h, source: "cache" }));
  }

  // 2. Query Overpass API (OpenStreetMap data)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    // Overpass QL query: hospitals, emergency centers, trauma clinics
    const query = `
      [out:json][timeout:8];
      (
        node["amenity"="hospital"](around:${nRadius},${nLat},${nLng});
        way["amenity"="hospital"](around:${nRadius},${nLat},${nLng});
        relation["amenity"="hospital"](around:${nRadius},${nLat},${nLng});
        node["healthcare"="hospital"](around:${nRadius},${nLat},${nLng});
        node["emergency"="yes"](around:${nRadius},${nLat},${nLng});
      );
      out center 20;
    `.trim();

    const response = await fetch(env.OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": env.USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Overpass API HTTP error ${response.status}`);
    }

    const data = await response.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];

    const hospitals = [];
    const seenNames = new Set();

    for (const el of elements) {
      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || tags.operator;

      // Skip elements without a recognizable name
      if (!name || seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      const hLat = el.lat || el.center?.lat;
      const hLng = el.lon || el.center?.lon;

      if (!hLat || !hLng) continue;

      const distM = calculateDistanceMeters(nLat, nLng, hLat, hLng);
      const distKm = calculateDistanceKm(nLat, nLng, hLat, hLng);
      const etaSec = estimateDurationSeconds(distM);

      hospitals.push({
        id: `osm_${el.type}_${el.id}`,
        name,
        type: tags.healthcare || tags.amenity || "Hospital",
        lat: hLat,
        lng: hLng,
        address: formatOsmAddress(tags),
        phone: tags.phone || tags["contact:phone"] || "+91 emergency-line",
        emergency: tags.emergency === "yes" || true,
        traumaLevel: tags.trauma || "Level 1/2",
        icuBedsAvailable: Math.floor(Math.random() * 6) + 2, // Live simulation
        operatingRooms: 2,
        distanceMeters: distM,
        distanceKm: distKm,
        etaSeconds: etaSec,
        tags: {
          amenity: tags.amenity,
          healthcare: tags.healthcare,
          emergency: tags.emergency,
        },
        source: "overpass_osm",
        isFallback: false,
      });
    }

    // Sort ascending by distance
    hospitals.sort((a, b) => a.distanceMeters - b.distanceMeters);

    if (hospitals.length > 0) {
      // Cache in Redis (10 minutes)
      await setCache(cacheKey, hospitals, CACHE_TTL_HOSPITALS);
      return hospitals;
    }

    // If Overpass returned 0 hospitals, fall back gracefully
    console.warn("Overpass returned 0 hospitals in area; using curated fallback");
    return getFallbackHospitals(nLat, nLng, nRadius);
  } catch (error) {
    console.warn("Overpass API request failed:", error.message);
    // Graceful fallback to mock data
    return getFallbackHospitals(nLat, nLng, nRadius);
  }
}

function formatOsmAddress(tags) {
  const parts = [
    tags["addr:street"] ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`.trim() : null,
    tags["addr:suburb"] || tags["addr:district"],
    tags["addr:city"],
    tags["addr:postcode"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Nearby Emergency Zone";
}

export default {
  findNearbyHospitals,
};

