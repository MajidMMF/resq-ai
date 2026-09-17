import { redis } from "../redis/redis.js";
import { sendError } from "../http/responses.js";

export const authenticate = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
      return sendError(res, 401, "Authentication required");
    }

    const session = await redis.get(`session-${sessionId}`);

    if (!session) {
      res.clearCookie("session");
      return sendError(res, 401, "Session expired");
    }

    req.auth = JSON.parse(session);
    req.sessionId = sessionId;
    return next();
  } catch (error) {
    console.error("Session authentication error:", error);
    return sendError(res, 500, "Authentication failed", error.message);
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return sendError(res, 401, "Authentication required");
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return sendError(res, 403, "You are not allowed to access this resource");
    }

    return next();
  };
};
