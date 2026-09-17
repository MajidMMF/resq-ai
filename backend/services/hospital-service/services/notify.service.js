import axios from "axios";
import { env } from "../config/env.js";
import { getSocket } from "../config/socketClient.js";

/**
 * Update incident status in Incident Service via HTTP
 */
export const notifyIncident = async (incidentId, status, metadata = {}) => {
  try {
    const response = await axios.patch(
      `${env.INCIDENT_SERVICE}/api/incidents/${incidentId}/status`,
      {
        status,
        metadata: {
          ...metadata,
          updatedByService: "hospital-service",
          updatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "x-internal-secret": env.INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `[notifyIncident] Failed to update incident ${incidentId} to ${status}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Socket.IO event emission helper
 */
const emitSocket = (event, payload) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit(event, payload);
  } else {
    console.warn(`[Socket] Cannot emit '${event}', socket not connected`);
  }
};

/**
 * Broadcast event to incident room
 */
export const broadcastToIncident = (incidentId, event, data) => {
  emitSocket("hospital:emit_to_room", {
    room: `incident:${incidentId}`,
    event,
    data,
  });
};

/**
 * Broadcast event to specific hospital room
 */
export const broadcastToHospital = (hospitalId, event, data) => {
  emitSocket("hospital:emit_to_room", {
    room: `hospital:${hospitalId}`,
    event,
    data,
  });
};

/**
 * Broadcast event to operations admin room
 */
export const broadcastToAdmin = (event, data) => {
  emitSocket("hospital:emit_to_room", {
    room: "admin:operations",
    event,
    data,
  });
};

