import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import { initDB } from "./config/db.js";
import { initSocket } from "./config/socketClient.js";
import "./config/redis.js";
import ambulanceRoutes from "./routes/ambulance.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";

// Ambulance Service on port 8007
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ambulance-service",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/ambulances/me/assignments", assignmentRoutes);
app.use("/api/ambulances", ambulanceRoutes);

// Fallback mounts for gateway proxy compatibility (when prefix is stripped)
app.use("/me/assignments", assignmentRoutes);
app.use("/", ambulanceRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error("Ambulance Service Error:", err);

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

async function start() {
  await initDB();
  initSocket();
  app.listen(env.PORT, () => {
    console.log(`🚑 ResQ Ambulance Service running on port ${env.PORT}`);
  });
}

start();

export default app;

