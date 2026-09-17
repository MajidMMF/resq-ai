import { emitToRoom } from "../config/socketClient.js";
import { env } from "../config/env.js";
import axios from "axios";

/**
 * Notify incident-service via HTTP about status transitions
 */
export async function notifyIncident(incidentId, status, metadata = {}) {
  try {
    await axios.post(
      `${env.INCIDENT_SERVICE}/api/incidents/${incidentId}/status`,
      { status, metadata },
      {
        headers: {
          "x-internal-secret": env.INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
  } catch (err) {
    console.warn("Incident notify failed:", err.response?.data?.message || err.message);
  }
}

export function broadcastToIncident(incidentId, event, payload) {
  return emitToRoom(`incident:${incidentId}`, event, payload);
}

export function broadcastToAmbulance(ambulanceId, event, payload) {
  return emitToRoom(`ambulance:${ambulanceId}`, event, payload);
}

export function broadcastToUser(userId, event, payload) {
  if (!userId) return false;
  return emitToRoom(`user:${userId}`, event, payload);
}

export function broadcastToHospital(hospitalId, event, payload) {
  if (!hospitalId) return false;
  return emitToRoom(`hospital:${hospitalId}`, event, payload);
}

export function broadcastToOperations(event, payload) {
  return emitToRoom("admin:operations", event, payload);
}

export default {
  notifyIncident,
  broadcastToIncident,
  broadcastToAmbulance,
  broadcastToUser,
  broadcastToHospital,
  broadcastToOperations,
};

