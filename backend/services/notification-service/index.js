import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import "./config/redis.js";
import { initSocket } from "./config/socketClient.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "500kb" }));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "notification-service",
    ts: Date.now(),
  });
});

// Mount notification routes (Both standard & root fallbacks)
app.use("/api/notifications", notificationRoutes);
app.use("/", notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error("Notification Service Unhandled Error:", err);
  return res.status(err.status || 500).json({
    success: false,
    code: err.code || "SERVER_ERROR",
    message: err.message || "An unexpected error occurred",
  });
});

async function start() {
  try {
    await connectDB();
    initSocket();

    app.listen(env.PORT, () => {
      console.log(`🔔 ResQ Notification Service running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
}

start();

export default app;

