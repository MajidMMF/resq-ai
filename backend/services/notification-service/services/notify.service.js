import { emitToRoom } from "../config/socketClient.js";
import Notification from "../models/notification.model.js";
import redis from "../config/redis.js";

/**
 * Persist notification in MongoDB, increment Redis unread cache, and emit socket event
 */
export async function createAndEmit({ userId, type, title, body, data = {} }) {
  // 1. Save to DB
  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    data,
  });

  // 2. Increment unread count in Redis
  await redis.incr(`notifications:unread:${userId}`).catch((err) => {
    console.warn(`[notify.service] Redis INCR error for user ${userId}:`, err.message);
  });

  // 3. Emit socket event to user room
  emitToRoom(`user:${userId}`, "notification:new", {
    _id: notification._id,
    userId,
    type,
    title,
    body,
    data,
    read: false,
    createdAt: notification.createdAt,
  });

  return notification;
}

/**
 * Decrement unread notification count in Redis
 */
export async function decrementUnread(userId) {
  try {
    const count = await redis.get(`notifications:unread:${userId}`);
    if (count !== null && parseInt(count, 10) > 0) {
      await redis.decr(`notifications:unread:${userId}`);
    }
  } catch (err) {
    console.warn(`[notify.service] Redis DECR error for user ${userId}:`, err.message);
  }
}

/**
 * Reset unread notification count to 0 in Redis
 */
export async function clearUnread(userId) {
  await redis.set(`notifications:unread:${userId}`, 0).catch((err) => {
    console.warn(`[notify.service] Redis clearUnread error for user ${userId}:`, err.message);
  });
}

export default {
  createAndEmit,
  decrementUnread,
  clearUnread,
};

