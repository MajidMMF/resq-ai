import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log("✅ Redis connected (ambulance-service)");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

export default redis;


