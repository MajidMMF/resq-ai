import * as cookie from "cookie";
import { env } from "../config/env.js";
import redis from "../config/redis.js";

/**
 * Socket.IO Handshake Authentication Middleware
 * Supports:
 *   Flow A: Frontend Clients (Session Cookie via resq_sid)
 *   Flow B: Internal Microservices (auth: { secret, service })
 */
export const handshakeAuth = async (socket, next) => {
  try {
    const auth = socket.handshake.auth || {};

    // Flow B: Internal Microservice authentication
    if (auth.secret) {
      if (auth.secret !== env.INTERNAL_SECRET) {
        console.warn(`[handshakeAuth] Internal auth failed: invalid secret from service: ${auth.service}`);
        return next(new Error("UNAUTHORIZED_INTERNAL"));
      }

      if (!auth.service) {
        return next(new Error("MISSING_SERVICE_NAME"));
      }

      socket.data = {
        type: "internal",
        service: auth.service,
      };

      return next();
    }

    // Flow A: Frontend Client authentication (Cookie)
    const rawCookieHeader = socket.handshake.headers.cookie;
    if (!rawCookieHeader) {
      console.warn("[handshakeAuth] Client connection rejected: No cookies provided");
      return next(new Error("NO_COOKIE"));
    }

    const parsedCookies = cookie.parse(rawCookieHeader);
    const sid = parsedCookies[env.SESSION_COOKIE_NAME];

    if (!sid) {
      console.warn(`[handshakeAuth] Client connection rejected: Missing ${env.SESSION_COOKIE_NAME} cookie`);
      return next(new Error("NO_SESSION"));
    }

    // Look up session in Redis
    const sessionRaw = await redis.get(`session:${sid}`);
    if (!sessionRaw) {
      console.warn(`[handshakeAuth] Client connection rejected: Session expired or invalid for sid: ${sid}`);
      return next(new Error("SESSION_EXPIRED"));
    }

    let session;
    try {
      session = JSON.parse(sessionRaw);
    } catch (parseErr) {
      console.error("[handshakeAuth] Failed to parse session JSON:", parseErr);
      return next(new Error("INVALID_SESSION_DATA"));
    }

    // Slide session TTL (keep active session alive for 24h)
    await redis.expire(`session:${sid}`, 86400);

    // Normalize roles array
    const roles = Array.isArray(session.roles)
      ? session.roles
      : session.role
      ? [session.role]
      : [];

    socket.data = {
      type: "client",
      userId: session.userId || session.id,
      roles,
      twoFactorVerified: !!session.twoFactorVerified,
      hospitalId: session.hospitalId || null,
      ambulanceId: session.ambulanceId || null,
      sessionId: sid,
    };

    return next();
  } catch (error) {
    console.error("[handshakeAuth] Unexpected error during handshake auth:", error);
    return next(new Error("AUTH_SERVER_ERROR"));
  }
};

