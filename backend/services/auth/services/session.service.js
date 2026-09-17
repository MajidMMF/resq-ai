import crypto from "crypto";
import { redis } from "../../../shared/redis/redis.js";
import { env } from "../config/env.js";

const sessionKey = (sessionId) => `session:${sessionId}`;
const userSessionKey = (userId) => `user-session:${userId}`;

export const createSession = async (user) => {
  const existingSessionId = await redis.get(userSessionKey(user._id.toString()));

  if (existingSessionId) {
    await redis.del(sessionKey(existingSessionId));
  }

  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    mobile: user.mobile,
    roles: user.roles,
    twoFactorVerified: true,
    hospitalId: user.hospitalId ?? null,
    ambulanceId: user.ambulanceId ?? null,
    createdAt: Date.now(),
  };

  await redis.set(
    sessionKey(sessionId),
    JSON.stringify(sessionData),
    "EX",
    env.SESSION_TTL
  );
  await redis.set(
    userSessionKey(user._id.toString()),
    sessionId,
    "EX",
    env.SESSION_TTL
  );

  return sessionId;
};

export const setSessionCookie = (res, sessionId) => {
  res.cookie(env.SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "lax",
    maxAge: env.SESSION_TTL * 1000,
    path: "/",
  });
};

export const getSession = async (sessionId) => {
  const raw = await redis.get(sessionKey(sessionId));
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
};

export const refreshSessionTtl = async (sessionId) => {
  await redis.expire(sessionKey(sessionId), env.SESSION_TTL);
};

export const destroySession = async (sessionId) => {
  const sessionData = await getSession(sessionId);

  if (sessionData?.userId) {
    await redis.del(userSessionKey(sessionData.userId));
  }

  await redis.del(sessionKey(sessionId));
};

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
});
