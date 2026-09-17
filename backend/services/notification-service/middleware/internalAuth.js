import { env } from "../config/env.js";

/**
 * Middleware to check internal service-to-service secret
 */
export const internalAuth = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];

  if (!secret || secret !== env.INTERNAL_SECRET) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED_INTERNAL_CALL",
      message: "Invalid or missing X-Internal-Secret",
    });
  }

  next();
};

/**
 * Middleware to extract and verify X-User-Id header for user-facing routes
 */
export const requireUserId = (req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({
      success: false,
      code: "MISSING_USER",
      message: "X-User-Id header is required",
    });
  }

  req.userId = userId;
  next();
};

export default { internalAuth, requireUserId };

