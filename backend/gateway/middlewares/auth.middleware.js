import redis from "../../shared/redis/redis.js";


const sessionCookieName = process.env.SESSION_COOKIE_NAME || "resq_sid";

export async function protect(req, res, next) {
  try {
    const sessionId = req.cookies?.[sessionCookieName];

    if (!sessionId) {
      return res.status(401).json({ success: false, code: "NO_SESSION" });
    }

    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) {
      return res.status(401).json({ success: false, code: "SESSION_EXPIRED" });
    }

    const session = JSON.parse(raw);
    req.user = { ...session, sessionId };

    // Sliding TTL
    await redis.expire(`session:${sessionId}`, 86400);

    next();
  } catch (error) {
    console.error("protect error:", error);
    return res.status(500).json({ success: false, code: "AUTH_INTERNAL" });
  }
}

export default protect;