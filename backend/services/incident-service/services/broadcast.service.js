import { io } from "socket.io-client";

const SOCKET_SERVICE_URL = process.env.SOCKET_SERVICE || "http://localhost:8010";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE || "http://localhost:8009";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "change-this-to-random-string";

let socketClient = null;

// Initialize optional persistent socket client for incident-service
export function getSocketClient() {
  if (!socketClient) {
    try {
      socketClient = io(SOCKET_SERVICE_URL, {
        auth: {
          secret: INTERNAL_SECRET,
          service: "incident-service",
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
      });

      socketClient.on("connect", () => {
        console.log("📡 [incident-service] Connected to socket-service");
      });

      socketClient.on("connect_error", (err) => {
        console.warn("⚠️ [incident-service] Socket connection error:", err.message);
      });
    } catch (err) {
      console.warn("⚠️ [incident-service] Failed to init socket client:", err.message);
    }
  }
  return socketClient;
}

/**
 * Broadcast new incident to all registered ambulances, hospitals, and admins
 * Uses both HTTP /broadcast endpoint on socket-service and persistent socket fallback
 */
export async function broadcastNewIncident(incident) {
  const payload = {
    incident: {
      _id: incident._id.toString(),
      type: incident.description || "Severe Trauma / Road Collision",
      description: incident.description || "Immediate emergency assistance requested",
      location: incident.location || {
        type: "Point",
        coordinates: [78.5723865, 17.4773742],
        address: "Dispatched Scene Coordinates",
      },
      status: incident.status || "CREATED",
      priority: "CRITICAL",
      createdAt: incident.createdAt || new Date(),
    },
    message: "🚨 NEW EMERGENCY INCIDENT REPORTED",
    timestamp: Date.now(),
  };

  const targetRooms = ["ambulances", "role:ambulance", "hospitals", "role:hospital", "admin:operations", "all"];

  console.log(`🚨 [broadcastNewIncident] Broadcasting Incident #${payload.incident._id} to [${targetRooms.join(", ")}]`);

  // 1. HTTP broadcast to socket-service
  try {
    const res = await fetch(`${SOCKET_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        rooms: targetRooms,
        event: "incident:created",
        payload,
      }),
    });

    if (res.ok) {
      console.log(`✅ [broadcastNewIncident] HTTP broadcast delivered to socket-service`);
    } else {
      console.warn(`⚠️ [broadcastNewIncident] HTTP broadcast returned ${res.status}`);
    }
  } catch (httpErr) {
    console.warn(`⚠️ [broadcastNewIncident] HTTP broadcast failed:`, httpErr.message);

    // Fallback: Persistent socket emit
    try {
      const client = getSocketClient();
      if (client && client.connected) {
        client.emit("internal:broadcast", {
          rooms: targetRooms,
          event: "incident:created",
          payload,
        });
        console.log(`✅ [broadcastNewIncident] Emitted via fallback socket client`);
      }
    } catch (sockErr) {
      console.error(`❌ [broadcastNewIncident] Fallback socket failed:`, sockErr.message);
    }
  }

  // 2. Also emit general notification alert
  try {
    await fetch(`${SOCKET_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        rooms: targetRooms,
        event: "notification:new",
        payload: {
          title: "🚨 New Emergency Callout",
          body: `Emergency reported at ${payload.incident.location?.address || "GPS Coordinates"}. Immediate response requested.`,
          type: "EMERGENCY_DISPATCH",
          data: { incidentId: payload.incident._id },
          createdAt: new Date(),
        },
      }),
    });
  } catch (e) {}

  return payload;
}

/**
 * Broadcast notification specifically when a citizen selects a hospital
 */
export async function broadcastHospitalSelection(incident, hospitalId, hospitalData) {
  const payload = {
    incident: {
      _id: incident._id.toString(),
      type: incident.incidentType || incident.description || "Severe Trauma / Road Collision",
      description: incident.description || "Inbound emergency trauma case directed to your center",
      location: incident.location || {
        type: "Point",
        coordinates: [78.5723865, 17.4773742],
        address: "Dispatched Scene Coordinates",
      },
      status: incident.status || "HOSPITAL_SELECTED",
      priority: incident.priority || "CRITICAL",
      createdAt: incident.createdAt || new Date(),
      hospitalId: hospitalId.toString(),
      selectedHospitalId: hospitalId.toString(),
      hospitalData,
    },
    message: "🚨 INCOMING TRAUMA PATIENT DIRECTED TO YOUR FACILITY",
    timestamp: Date.now(),
  };

  const targetRooms = [
    `hospital:${hospitalId}`,
    "role:hospital",
    "hospitals",
    "admin:operations",
    "all",
  ];

  console.log(`🏥 [broadcastHospitalSelection] Notifying rooms [${targetRooms.join(", ")}] for Incident #${payload.incident._id}`);

  try {
    await fetch(`${SOCKET_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        rooms: targetRooms,
        event: "emergency:new",
        payload,
      }),
    });

    await fetch(`${SOCKET_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        rooms: targetRooms,
        event: "incident:created",
        payload,
      }),
    });

    await fetch(`${SOCKET_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        rooms: targetRooms,
        event: "hospital:assigned",
        payload,
      }),
    });
  } catch (err) {
    console.warn("⚠️ [broadcastHospitalSelection] Broadcast failed:", err.message);
  }

  return payload;
}

/**
 * Broadcast status transitions (e.g. RESOLVED, EN_ROUTE, ARRIVED) to incident, user, ambulance, hospital
 */
export async function broadcastIncidentStatusUpdate(incident, newStatus, metadata = {}) {
  const incidentId = incident._id.toString();
  const reporterId = incident.reporterId ? incident.reporterId.toString() : null;
  const ambulanceId = incident.assignedAmbulanceId || incident.ambulanceId ? (incident.assignedAmbulanceId || incident.ambulanceId).toString() : null;
  const hospitalId = incident.selectedHospitalId || incident.hospitalId ? (incident.selectedHospitalId || incident.hospitalId).toString() : null;

  const payload = {
    incidentId,
    status: newStatus,
    metadata,
    incident: {
      _id: incidentId,
      status: newStatus,
      arrivalOtp: incident.arrivalOtp,
      ambulanceId,
      hospitalId,
      assignedAmbulanceDetails: incident.assignedAmbulanceDetails,
      resolvedAt: incident.resolvedAt,
    },
    timestamp: Date.now(),
  };

  const targetRooms = [
    `incident:${incidentId}`,
    "admin:operations",
    "all",
  ];
  if (reporterId) targetRooms.push(`user:${reporterId}`);
  if (ambulanceId) targetRooms.push(`ambulance:${ambulanceId}`);
  if (hospitalId) targetRooms.push(`hospital:${hospitalId}`);

  try {
    await fetch(`${SOCKET_SERVICE_URL}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        rooms: targetRooms,
        event: "incident:status_updated",
        payload,
      }),
    });
  } catch (err) {
    console.warn("⚠️ [broadcastIncidentStatusUpdate] Broadcast failed:", err.message);
  }

  return payload;
}



