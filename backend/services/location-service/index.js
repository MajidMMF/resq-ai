import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import "./config/redis.js"; // Shared Redis connection
import locationRoutes from "./routes/location.routes.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "location-service",
    stack: "OSM / Nominatim / OSRM / Overpass (100% Free)",
    timestamp: new Date().toISOString(),
  });
});

// Primary mounts
app.use("/api/locations", locationRoutes);

// Fallback mount when gateway strips prefix
app.use("/", locationRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Location Service Error:", err);

  if (err?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: err.errors?.[0]?.message || "Invalid payload",
      errors: err.errors,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "An unexpected error occurred",
  });
});

app.listen(env.PORT, () => {
  console.log(`🗺️  ResQ Location Service running on port ${env.PORT}`);
});

export default app;

