import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSocketClient } from "./config/socketClient.js";
import hospitalRoutes from "./routes/hospital.routes.js";
import incomingRoutes from "./routes/incoming.routes.js";

// Hospital Service on port 8006
const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "hospital-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use("/me", incomingRoutes);
app.use("/", hospitalRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Hospital Service Error]:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    initSocketClient();

    app.listen(env.PORT, () => {
      console.log(`[Hospital Service] Running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("[Hospital Service] Fatal startup error:", error);
    process.exit(1);
  }
};

startServer();

export default app;

