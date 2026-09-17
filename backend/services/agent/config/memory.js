import { redis } from "../../../shared/redis/redis.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const MEMORY_TTL = 30 * 60; // 30 minutes
const MAX_MESSAGES = 50;

const keyForIncident = (incidentId, userId) =>
  `ai:memory:${incidentId}:${userId}`;

/* ──────────────────────────────────────────
   Parse cached messages (safe)
   ────────────────────────────────────────── */
const parseCachedMessages = async (key, cached) => {
  if (!cached) return null;

  try {
    const messages = JSON.parse(cached);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.warn(`Invalid Redis memory cache for ${key}; refreshing.`);
    await redis.del(key);
    return null;
  }
};

/* ──────────────────────────────────────────
   Normalize message for LLM
   ────────────────────────────────────────── */
const normalizeMessage = (msg) => ({
  role: msg?.role,
  content: msg?.content,
});

const isSameMessage = (a, b) =>
  a?.role === b?.role && String(a?.content || "") === String(b?.content || "");

/* ──────────────────────────────────────────
   Fetch messages from MongoDB
   ────────────────────────────────────────── */
const fetchMessagesFromDB = async (incidentId, userId) => {
  const conversation = await Conversation.findOne({ incidentId, userId });
  if (!conversation) return [];

  const messages = await Message.find({
    conversationId: conversation._id,
  })
    .sort({ createdAt: 1 })
    .limit(MAX_MESSAGES)
    .lean();

  return messages.map(normalizeMessage);
};

/* ──────────────────────────────────────────
   GET MEMORY
   ────────────────────────────────────────── */
export const getMemory = async (incidentId, userId) => {
  if (!incidentId || !userId) return [];

  const key = keyForIncident(incidentId, userId);

  // 1. Try Redis
  try {
    const cached = await redis.get(key);
    const cachedMessages = await parseCachedMessages(key, cached);
    if (cachedMessages) return cachedMessages;
  } catch (redisErr) {
    console.warn("Redis getMemory error:", redisErr.message);
  }

  // 2. Fallback: MongoDB
  try {
    const messages = await fetchMessagesFromDB(incidentId, userId);
    if (messages.length > 0) {
      await redis.set(key, JSON.stringify(messages), "EX", MEMORY_TTL).catch(() => {});
    }
    return messages;
  } catch (dbErr) {
    console.warn("fetchMessagesFromDB error:", dbErr.message);
    return [];
  }
};


/* ──────────────────────────────────────────
   ADD MESSAGE
   ────────────────────────────────────────── */
export const addMessage = async (incidentId, userId, role, content) => {
  const key = keyForIncident(incidentId, userId);

  const rawMessages = await redis.get(key);
  let messages = await parseCachedMessages(key, rawMessages);

  // If no cache → load from DB
  if (!messages) {
    messages = await fetchMessagesFromDB(incidentId, userId);
  }

  const nextMessage = { role, content };
  const lastMessage = messages[messages.length - 1];

  // Dedup: skip if same as last
  if (!isSameMessage(lastMessage, nextMessage)) {
    messages.push(nextMessage);
  }

  // Trim to MAX_MESSAGES
  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(-MAX_MESSAGES);
  }

  await redis.set(key, JSON.stringify(messages), "EX", MEMORY_TTL);
};

/* ──────────────────────────────────────────
   CLEAR MEMORY (optional)
   ────────────────────────────────────────── */
export const clearMemory = async (incidentId, userId) => {
  await redis.del(keyForIncident(incidentId, userId));
};