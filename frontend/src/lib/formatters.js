/**
 * Format distance in kilometers or meters
 */
export function formatDistance(meters) {
  if (!meters && meters !== 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format minutes into readable ETA
 */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

/**
 * Format ISO date string into readable short date
 */
export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

