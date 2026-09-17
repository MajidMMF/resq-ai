import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8005),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  NOMINATIM_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  OSRM_URL: z.string().url().default("https://router.project-osrm.org"),
  OVERPASS_URL: z.string().url().default("https://overpass-api.de/api/interpreter"),
  USER_AGENT: z.string().default("ResQ-AI-Showcase/1.0 (contact@resqai.dev)"),
  INTERNAL_SECRET: z.string().default("change-this-to-random-string"),
  USE_MOCK_FALLBACK: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation error in location-service:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;

