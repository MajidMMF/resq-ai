/**
 * Room management and authorization logic for ResQ Socket Service
 */

/**
 * Auto-join standard rooms for authenticated clients upon connection
 * @param {Socket} socket
 * @param {Server} io
 */
export const autoJoinRooms = (socket, io) => {
  const { userId, roles = [], twoFactorVerified, hospitalId, ambulanceId } = socket.data;

  // 1. Every user joins their private user room
  if (userId) {
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
  }

  // 2. Ambulance driver auto-joins general ambulance broadcast rooms + specific unit room
  if (roles.includes("AMBULANCE_DRIVER") || ambulanceId) {
    socket.join("ambulances");
    socket.join("role:ambulance");
    if (ambulanceId) {
      socket.join(`ambulance:${ambulanceId}`);
    }
  }

  // 3. Hospital staff auto-joins general hospital broadcast rooms + specific hospital room
  if (
    roles.includes("HOSPITAL_STAFF") ||
    roles.includes("DOCTOR") ||
    roles.includes("NURSE") ||
    hospitalId
  ) {
    socket.join("hospitals");
    socket.join("role:hospital");
    if (hospitalId) {
      socket.join(`hospital:${hospitalId}`);
    }
  }

  // 4. Admin joins admin operations room
  if (roles.includes("ADMIN")) {
    socket.join("admin:operations");
  }
};

/**
 * Check if a client socket is authorized to join a requested room
 * @param {Socket} socket
 * @param {string} room
 * @returns {boolean}
 */
export const canJoinRoom = (socket, room) => {
  if (!room || typeof room !== "string") {
    return false;
  }

  // Internal services do not join rooms directly
  if (socket.data.type !== "client") {
    return false;
  }

  const { userId, roles = [], twoFactorVerified, hospitalId, ambulanceId } = socket.data;

  // General broadcast rooms
  if (room === "ambulances" || room === "role:ambulance") {
    return roles.includes("AMBULANCE_DRIVER") || roles.includes("ADMIN");
  }

  if (room === "hospitals" || room === "role:hospital") {
    return (
      roles.includes("HOSPITAL_STAFF") ||
      roles.includes("DOCTOR") ||
      roles.includes("NURSE") ||
      roles.includes("ADMIN")
    );
  }

  // Pattern 1: user:{userId} -> only that user's socket
  if (room.startsWith("user:")) {
    const targetUserId = room.split(":")[1];
    return targetUserId === userId;
  }

  // Pattern 2: ambulance:{ambulanceId} -> only that ambulance's driver or admin
  if (room.startsWith("ambulance:")) {
    const targetAmbId = room.split(":")[1];
    if (roles.includes("ADMIN")) return true;
    return roles.includes("AMBULANCE_DRIVER") && ambulanceId === targetAmbId;
  }

  // Pattern 3: hospital:{hospitalId} -> only staff of that hospital or admin
  if (room.startsWith("hospital:")) {
    const targetHospId = room.split(":")[1];
    if (roles.includes("ADMIN")) return true;
    return (
      (roles.includes("HOSPITAL_STAFF") || roles.includes("DOCTOR") || roles.includes("NURSE")) &&
      hospitalId === targetHospId
    );
  }

  // Pattern 4: admin:operations -> only ADMIN
  if (room === "admin:operations") {
    return roles.includes("ADMIN");
  }

  // Pattern 5: incident:{incidentId} -> authenticated clients can join
  if (room.startsWith("incident:")) {
    return !!userId;
  }

  return false;
};

