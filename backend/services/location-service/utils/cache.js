import redis from "../config/redis.js";

export function simpleHash(str) {
  if (!str) return "empty";
  let hash = 0;
  const s = String(str).toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getCache(key) {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCache(key, value, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.warn("Cache set failed:", err.message);
  }
}

export const cacheKeys = {
  hospitals: (lat, lng, radius) =>
    `cache:hospitals:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}:${radius}`,
  route: (from, to) =>
    `cache:route:${Number(from.lat).toFixed(4)}:${Number(from.lng).toFixed(4)}:${Number(to.lat).toFixed(4)}:${Number(to.lng).toFixed(4)}`,
  geocode: (address) => `cache:geocode:${simpleHash(address)}`,
  reverseGeocode: (lat, lng) =>
    `cache:revgeo:${Number(lat).toFixed(5)}:${Number(lng).toFixed(5)}`,
  autocomplete: (input) => `cache:autocomplete:${simpleHash(input)}`,
};

export default {
  getCache,
  setCache,
  cacheKeys,
  simpleHash,
};

