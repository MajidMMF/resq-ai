/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const meters = calculateDistanceMeters(lat1, lon1, lat2, lon2);
  return Math.round((meters / 1000) * 10) / 10;
}

/**
 * Estimates driving ETA in seconds based on straight-line distance with a winding factor
 * (City traffic average: ~35 km/h, road network detour factor ~1.3)
 */
export function estimateDurationSeconds(distanceMeters, avgSpeedKmh = 35) {
  const roadDistanceMeters = distanceMeters * 1.3;
  const speedMetersPerSec = (avgSpeedKmh * 1000) / 3600;
  return Math.round(roadDistanceMeters / speedMetersPerSec);
}

export default {
  calculateDistanceMeters,
  calculateDistanceKm,
  estimateDurationSeconds,
};

