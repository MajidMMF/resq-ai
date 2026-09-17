import express from "express"
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors"
import cookieParser from "cookie-parser";
import proxy from "express-http-proxy";
dotenv.config()
const app = express();
const port = process.env.PORT || 8000
import { redis } from "../shared/redis/redis.js";
import { getCurrentUser } from "./controllers/getCurrentUser.js";
import { protect } from "./middlewares/auth.middleware.js";

const sessionCookieName = process.env.SESSION_COOKIE_NAME || "resq_sid";

const mountService = (path, target, preservePath = false) => {
   if (!target) {
      console.warn(`⚠️ ${path} proxy is disabled because its service URL is not configured`)
      return
   }

   app.use(path, proxy(target, {
      limit: "50mb",
      userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
         headers["access-control-allow-origin"] = process.env.FRONTEND_URL || "http://localhost:5173";
         headers["access-control-allow-credentials"] = "true";
         return headers;
      },
      proxyReqPathResolver: (req) => {
         if (preservePath) return req.originalUrl;
         let resolved = req.originalUrl.replace(new RegExp(`^${path}`), "") || "/";
         if (!resolved.startsWith("/")) {
            resolved = "/" + resolved;
         }
         return resolved;
      },
      proxyReqOptDecorator: async (proxyReqOpts, srcReq) => {
         // Forward internal secret so downstream services accept the call
         proxyReqOpts.headers["x-internal-secret"] = process.env.INTERNAL_SECRET || "change-this-to-random-string";

         // Forward client user id header if supplied
         if (srcReq.headers["x-user-id"]) {
            proxyReqOpts.headers["x-user-id"] = String(srcReq.headers["x-user-id"]);
         }

         // Check session cookie from user request
         const sid = srcReq.cookies?.[sessionCookieName];
         if (sid) {
            try {
               const raw = await redis.get(`session:${sid}`);
               if (raw) {
                  const sess = JSON.parse(raw);
                  if (sess?.userId) {
                     proxyReqOpts.headers["x-user-id"] = String(sess.userId);
                  }
                  if (sess?.email) {
                     proxyReqOpts.headers["x-user-email"] = String(sess.email);
                  }
                  if (Array.isArray(sess?.roles)) {
                     proxyReqOpts.headers["x-user-roles"] = sess.roles.join(",");
                  }
               }
            } catch (err) {
               console.error("Session resolve in gateway proxy failed:", err.message);
            }
         }
         return proxyReqOpts;
      },
   }))
}

app.use(cors({
   origin: process.env.FRONTEND_URL,
   credentials: true
}))
app.use(morgan("dev"))
app.use(cookieParser())

mountService("/api/auth", process.env.AUTH_SERVICE)
mountService("/api/emergencies", process.env.EMERGENCY_SERVICE)
mountService("/api/incident-service", process.env.INCIDENT_SERVICE)
mountService("/api/incidents", process.env.INCIDENT_SERVICE)
mountService("/api/agent", process.env.AGENT_SERVICE, true)
mountService("/api/ai", process.env.AGENT_SERVICE, true)
mountService("/api/ambulances", process.env.AMBULANCE_SERVICE)
mountService("/api/locations", process.env.LOCATION_SERVICE)
mountService("/api/hospitals", process.env.HOSPITAL_SERVICE)
mountService("/api/notifications", process.env.NOTIFICATION_SERVICE)

app.get("/api/me", protect, getCurrentUser);

app.get("/",(req,res)=>{
   res.json({
      message:"gateway service "
   })
})
app.listen(port,()=>{
   console.log("✅gateway service is running on port:",port)
})
