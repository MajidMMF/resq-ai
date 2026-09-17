import { canJoinRoom } from "../services/rooms.service.js";

/**
 * Register client event handlers for room joining and leaving
 * @param {Socket} socket
 * @param {Server} io
 */
export const registerClientHandlers = (socket, io) => {
  // Only client sockets should handle client events
  if (socket.data.type !== "client") {
    return;
  }

  // Event: room:join
  socket.on("room:join", ({ room }, callback) => {
    try {
      if (!room) {
        if (typeof callback === "function") {
          return callback({ success: false, code: "MISSING_ROOM", error: "Room name is required" });
        }
        return;
      }

      const allowed = canJoinRoom(socket, room);
      if (!allowed) {
        console.warn(`[ClientHandler] Socket ${socket.id} (user: ${socket.data.userId}) forbidden from joining ${room}`);
        if (typeof callback === "function") {
          return callback({ success: false, code: "FORBIDDEN", error: "Not authorized to join this room" });
        }
        return;
      }

      socket.join(room);
      console.log(`[ClientHandler] Socket ${socket.id} joined room: ${room}`);

      if (typeof callback === "function") {
        return callback({ success: true, room });
      }
    } catch (err) {
      console.error(`[ClientHandler] Error on room:join for socket ${socket.id}:`, err);
      if (typeof callback === "function") {
        return callback({ success: false, code: "ERROR", error: err.message });
      }
    }
  });

  // Event: room:leave
  socket.on("room:leave", ({ room }, callback) => {
    try {
      if (room) {
        socket.leave(room);
        console.log(`[ClientHandler] Socket ${socket.id} left room: ${room}`);
      }
      if (typeof callback === "function") {
        return callback({ success: true, room });
      }
    } catch (err) {
      console.error(`[ClientHandler] Error on room:leave for socket ${socket.id}:`, err);
      if (typeof callback === "function") {
        return callback({ success: false, code: "ERROR", error: err.message });
      }
    }
  });
};

