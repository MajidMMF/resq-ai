import { io } from "socket.io-client";
import { env } from "./env.js";

let socket = null;

export function initSocket() {
  if (socket) return socket;

  socket = io(env.SOCKET_SERVICE, {
    auth: {
      secret: env.INTERNAL_SECRET,
      service: "hospital-service",
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected (hospital internal)");
  });

  socket.on("disconnect", () => {
    console.warn("⚠️  Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
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

export const initSocketClient = initSocket;
export default { initSocket, emitToRoom, getSocket, initSocketClient };

