/**
 * Broadcast Service for emitting Socket.IO events to rooms or multiple rooms
 */

/**
 * Broadcast event to a single room
 * @param {Server} io - Socket.io server instance
 * @param {string} room - Target room name
 * @param {string} event - Event name
 * @param {any} payload - Event payload
 */
export const broadcast = (io, room, event, payload) => {
  if (!io || !room || !event) {
    console.warn("[Broadcast] Missing required parameters for broadcast:", { room, event });
    return false;
  }
  io.to(room).emit(event, payload);
  return true;
};

/**
 * Broadcast event to multiple rooms simultaneously
 * @param {Server} io - Socket.io server instance
 * @param {string[]} rooms - Array of target room names
 * @param {string} event - Event name
 * @param {any} payload - Event payload
 */
export const broadcastToMultiple = (io, rooms, event, payload) => {
  if (!io || !Array.isArray(rooms) || !event) {
    console.warn("[BroadcastToMultiple] Missing parameters:", { rooms, event });
    return false;
  }

  rooms.filter(Boolean).forEach((room) => {
    io.to(room).emit(event, payload);
  });
  return true;
};

