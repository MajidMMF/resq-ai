const ALLOWED_SERVICES = [
  "auth-service",
  "incident-service",
  "ambulance-service",
  "hospital-service",
  "location-service",
  "agent-service",
  "emergency-service",
];

/**
 * Register internal service event handlers for service-to-service broadcasting
 * @param {Socket} socket
 * @param {Server} io
 */
export const registerInternalHandlers = (socket, io) => {
  // Only internal services should register these handlers
  if (socket.data.type !== "internal") {
    return;
  }

  // Event: internal:broadcast
  socket.on("internal:broadcast", ({ room, rooms, event, payload }, callback) => {
    try {
      const { service } = socket.data;

      // Validate whitelist
      if (!ALLOWED_SERVICES.includes(service)) {
        console.warn(`[InternalHandler] Service '${service}' is not in allowed whitelist`);
        if (typeof callback === "function") {
          return callback({
            success: false,
            code: "SERVICE_NOT_ALLOWED",
            error: `Service ${service} not authorized to broadcast`,
          });
        }
        return;
      }

      if (!event) {
        if (typeof callback === "function") {
          return callback({
            success: false,
            code: "MISSING_FIELDS",
            error: "Event name is required",
          });
        }
        return;
      }

      // Handle multi-room or single-room emission
      const targetRooms = rooms && Array.isArray(rooms) ? rooms : room ? [room] : [];

      if (targetRooms.length === 0) {
        if (typeof callback === "function") {
          return callback({
            success: false,
            code: "MISSING_ROOM",
            error: "At least one target room is required",
          });
        }
        return;
      }

      targetRooms.forEach((targetRoom) => {
        io.to(targetRoom).emit(event, payload);
      });

      console.log(
        `[InternalHandler] [${service}] Broadcasted '${event}' to rooms: [${targetRooms.join(", ")}]`
      );

      if (typeof callback === "function") {
        return callback({
          success: true,
          event,
          rooms: targetRooms,
        });
      }
    } catch (err) {
      console.error(`[InternalHandler] Error handling internal:broadcast:`, err);
      if (typeof callback === "function") {
        return callback({ success: false, code: "ERROR", error: err.message });
      }
    }
  });
};

