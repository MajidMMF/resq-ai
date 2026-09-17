import { env } from "../config/env.js";

/**
 * Middleware to verify internal service calls via X-Internal-Secret
 */
export const internalAuth = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== env.INTERNAL_SECRET) {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Invalid or missing internal secret",
    });
  }
  next();
};

/**
 * Middleware to ensure X-User-Id header is present (forwarded by Gateway)
 */
export const requireUserId = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing X-User-Id header",
    });
  }
  req.userId = userId;
  next();
};

