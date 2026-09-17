export const env = {
  PORT: Number(process.env.PORT) || 8001,
  NODE_ENV: process.env.NODE_ENV || "development",
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || "resq_sid",
  SESSION_TTL: Number(process.env.SESSION_TTL) || 86400,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};
