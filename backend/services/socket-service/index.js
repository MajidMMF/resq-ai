import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

import { env } from "./config/env.js";
import "./config/redis.js";
import { handshakeAuth } from "./middleware/handshakeAuth.js";
import { autoJoinRooms } from "./services/rooms.service.js";
import { registerClientHandlers } from "./handlers/client.handler.js";
import { registerInternalHandlers } from "./handlers/internal.handler.js";
import { registerAmbulanceHandlers } from "./handlers/ambulance.handler.js";

const app = express();

// Express CORS for HTTP health check
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "socket-service",
    ts: Date.now(),
  });
});

const server = http.createServer(app);

// Socket.IO Server configuration
const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Internal HTTP broadcast endpoint for microservices
app.post("/broadcast", (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (secret !== env.INTERNAL_SECRET) {
    return res.status(403).json({ success: false, error: "Forbidden: Invalid secret" });
  }

  const { room, rooms, event, payload } = req.body;
  if (!event) {
    return res.status(400).json({ success: false, error: "Event name is required" });
  }

  const targetRooms = rooms && Array.isArray(rooms) ? rooms : room ? [room] : ["all"];

  if (targetRooms.includes("all") || targetRooms.includes("broadcast")) {
    io.emit(event, payload);
  } else {
    targetRooms.forEach((r) => io.to(r).emit(event, payload));
  }

  console.log(`📡 [HTTP Broadcast] Event '${event}' sent to rooms: [${targetRooms.join(", ")}]`);
  return res.status(200).json({ success: true, event, rooms: targetRooms });
});

// Redis Adapter for multi-instance horizontal scaling
const pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => console.error("❌ Redis Adapter Pub Client Error:", err.message));
subClient.on("error", (err) => console.error("❌ Redis Adapter Sub Client Error:", err.message));

io.adapter(createAdapter(pubClient, subClient));

// Handshake Authentication Middleware
io.use(handshakeAuth);

// Connection Lifecycle
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id} (type: ${socket.data.type})`);

  // Auto-join rooms for frontend clients based on their authenticated session
  if (socket.data.type === "client") {
    autoJoinRooms(socket, io);
  }

  // Register event handlers
  registerClientHandlers(socket, io);
  registerInternalHandlers(socket, io);
  registerAmbulanceHandlers(socket, io);

  socket.on("disconnect", (reason) => {
    console.log(`❌ Disconnected: ${socket.id} (${reason})`);
  });
});

// Start HTTP & Socket Server
server.listen(env.PORT, () => {
  console.log(`📡 ResQ Socket Service running on port ${env.PORT}`);
});

export { app, server, io };
export default server;

