import redis from "../config/redis.js";

/**
 * Atomic sliding window rate limiter using Redis INCR and EXPIRE.
 *
 * @param {string} key - Redis key namespace
 * @param {number} max - Max allowed hits in the window
 * @param {number} windowSeconds - Expiry window in seconds
 * @returns {Promise<boolean>} true if allowed, false if limit exceeded
 */
export async function checkRateLimit(key, max = 1, windowSeconds = 1) {
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return count <= max;
  } catch (err) {
    console.warn("Rate limit check error, failing open:", err.message);
    return true;
  }
}

export default { checkRateLimit };

