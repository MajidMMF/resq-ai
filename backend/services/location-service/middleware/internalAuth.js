import { env } from "../config/env.js";

export const internalAuth = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];

  if (!secret || secret !== env.INTERNAL_SECRET) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED_INTERNAL_CALL",
      message: "Invalid or missing X-Internal-Secret header",
    });
  }

  next();
};

export default internalAuth;

