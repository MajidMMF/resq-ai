export const internalAuth = (req, res, next) => {
  const internalSecret = req.headers["x-internal-secret"];
  const expectedSecret = process.env.INTERNAL_SECRET;

  // If INTERNAL_SECRET is set in environment, enforce it. If not set (dev), allow request through.
  if (expectedSecret && internalSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED_INTERNAL_CALL",
      message: "Invalid internal secret",
    });
  }

  next();
};

export default internalAuth;
