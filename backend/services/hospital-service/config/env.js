import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8006),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  INCIDENT_SERVICE: z.string().default("http://localhost:8003"),
  SOCKET_SERVICE: z.string().default("http://localhost:8010"),
  INTERNAL_SECRET: z.string().default("change-this-to-random-string"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation error in hospital-service:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;

