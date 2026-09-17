import { env } from "../config/env.js";

export const internalAuth = (req, res, next) => {
  const internalSecret = req.headers["x-internal-secret"];

  if (!internalSecret || internalSecret !== env.INTERNAL_SECRET) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED_INTERNAL_CALL",
      message: "Invalid internal secret",
    });
  }

  next();
};
