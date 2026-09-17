import redis from "../config/redis.js";

/**
 * Register ambulance-specific event handlers for live GPS telematics
 * @param {Socket} socket
 * @param {Server} io
 */
export const registerAmbulanceHandlers = (socket, io) => {
  // Only client sockets of ambulance drivers can emit live location
  if (socket.data.type !== "client") {
    return;
  }

  // Event: ambulance:location
  socket.on("ambulance:location", async (data, callback) => {
    try {
      const {
        assignmentId,
        ambulanceId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        ts,
        incidentId,
        hospitalId,
      } = data || {};

      // 1. Verify role AMBULANCE_DRIVER
      const roles = socket.data.roles || [];
      if (!roles.includes("AMBULANCE_DRIVER")) {
        console.warn(`[AmbulanceHandler] Forbidden: User ${socket.data.userId} is not an AMBULANCE_DRIVER`);
        if (typeof callback === "function") {
          return callback({ success: false, code: "FORBIDDEN", error: "Only ambulance drivers can emit location" });
        }
        return;
      }

      // 2. Verify ambulance ownership
      if (socket.data.ambulanceId && socket.data.ambulanceId !== ambulanceId) {
        console.warn(
          `[AmbulanceHandler] Ownership mismatch: Socket ambulanceId (${socket.data.ambulanceId}) !== payload ambulanceId (${ambulanceId})`
        );
        if (typeof callback === "function") {
          return callback({ success: false, code: "FORBIDDEN", error: "Ambulance ID mismatch" });
        }
        return;
      }

      // Validate required coordinates
      if (latitude === undefined || longitude === undefined || !ambulanceId) {
        if (typeof callback === "function") {
          return callback({
            success: false,
            code: "MISSING_FIELDS",
            error: "ambulanceId, latitude, and longitude are required",
          });
        }
        return;
      }

      const timestamp = ts || Date.now();

      const locationPayload = {
        assignmentId: assignmentId || null,
        ambulanceId,
        latitude,
        longitude,
        heading: heading !== undefined ? heading : 0,
        speed: speed !== undefined ? speed : 0,
        accuracy: accuracy !== undefined ? accuracy : 0,
        ts: timestamp,
        incidentId: incidentId || null,
        hospitalId: hospitalId || null,
      };

      // 3. Write Redis cache with TTL 60 seconds
      const cacheKey = `live:ambulance:${ambulanceId}`;
      await redis.set(
        cacheKey,
        JSON.stringify({
          lat: latitude,
          lng: longitude,
          heading: locationPayload.heading,
          speed: locationPayload.speed,
          accuracy: locationPayload.accuracy,
          ts: timestamp,
          incidentId: locationPayload.incidentId,
          hospitalId: locationPayload.hospitalId,
        }),
        "EX",
        60
      );

      // 4. Broadcast live location update to relevant rooms
      const targetRooms = ["admin:operations"];
      if (incidentId) targetRooms.push(`incident:${incidentId}`);
      if (hospitalId) targetRooms.push(`hospital:${hospitalId}`);

      targetRooms.forEach((room) => {
        io.to(room).emit("ambulance:location_update", locationPayload);
      });

      // 5. ACK back to driver client
      if (typeof callback === "function") {
        return callback({
          success: true,
          ts: timestamp,
          ambulanceId,
        });
      }
    } catch (err) {
      console.error(`[AmbulanceHandler] Error updating location for socket ${socket.id}:`, err);
      if (typeof callback === "function") {
        return callback({ success: false, code: "ERROR", error: err.message });
      }
    }
  });
};

