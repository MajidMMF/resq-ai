import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["PORT", "REDIS_URL", "FRONTEND_URL", "INTERNAL_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 8010,
  REDIS_URL: process.env.REDIS_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || "resq_sid",
};

