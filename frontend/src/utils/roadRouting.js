/**
 * ResQ AI — Turn-by-Turn Road Routing Utility
 * Uses Open Source Routing Machine (OSRM) to fetch real road coordinates
 * so ambulances and polylines follow actual streets, lanes, and highways.
 */

const routeCache = new Map();

/**
 * Generates fallback linear points if routing service is unreachable
 */
export function generateLinearFallback(start, end, steps = 12) {
  if (!start || !end) return [];
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      Number((start[0] + (end[0] - start[0]) * t).toFixed(6)),
      Number((start[1] + (end[1] - start[1]) * t).toFixed(6)),
    ]);
  }
  return points;
}

/**
 * Fetches turn-by-turn driving road coordinates between start and end
 * @param {[number, number]} start - [latitude, longitude]
 * @param {[number, number]} end - [latitude, longitude]
 * @returns {Promise<Array<[number, number]>>} Array of [lat, lng] waypoints along real roads
 */
export async function fetchRoadRoute(start, end) {
  if (!start || !end || !start[0] || !start[1] || !end[0] || !end[1]) {
    return [];
  }

  // Cache key rounded to ~10 meters
  const startKey = `${start[0].toFixed(4)},${start[1].toFixed(4)}`;
  const endKey = `${end[0].toFixed(4)},${end[4]?.toFixed ? end[1].toFixed(4) : end[1].toFixed(4)}`;
  const cacheKey = `${startKey}->${endKey}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // OSRM format: lng,lat;lng,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM HTTP error: ${res.status}`);
    }

    const data = await res.json();
    if (data?.routes?.[0]?.geometry?.coordinates?.length > 0) {
      // OSRM returns [lng, lat] -> Leaflet uses [lat, lng]
      const waypoints = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      routeCache.set(cacheKey, waypoints);
      return waypoints;
    }
  } catch (err) {
    console.warn("⚠️ [RoadRouting] Falling back to interpolated path:", err.message);
  }

  const fallback = generateLinearFallback(start, end);
  routeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Calculates total route distance in kilometers along waypoints
 */
export function calculateRouteDistanceKm(waypoints) {
  if (!waypoints || waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lon1] = waypoints[i];
    const [lat2, lon2] = waypoints[i + 1];
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return Number(total.toFixed(2));
}
