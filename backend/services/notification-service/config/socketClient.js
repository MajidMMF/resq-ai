import { io } from "socket.io-client";
import { env } from "./env.js";

let socket = null;

export function initSocket() {
  if (socket) return socket;

  socket = io(env.SOCKET_SERVICE, {
    auth: {
      secret: env.INTERNAL_SECRET,
      service: "notification-service",
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected (notification-service)");
  });

  socket.on("disconnect", (reason) => {
    console.warn(`⚠️ Socket disconnected (notification-service): ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error (notification-service):", err.message);
  });

  return socket;
}

export function emitToRoom(room, event, payload) {
  if (!socket || !socket.connected) {
    console.warn(`Socket not connected. Skipping: ${event} → ${room}`);
    return false;
  }
  socket.emit("internal:broadcast", { room, event, payload });
  return true;
}

export function getSocket() {
  return socket;
}

export default { initSocket, emitToRoom, getSocket };

