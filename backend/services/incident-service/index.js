import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import { initDB } from "./config/db.js";
import incidentRoutes from "./routes/incident.routes.js";

dotenv.config();

// Incident Service running on port 8003
const app = express();
const port = process.env.PORT || 8003;

initDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/incident-service", (req, res) => {
  res.json({ status: "ok", service: "incident-service" });
});

app.use("/api/incidents", incidentRoutes);
app.use("/", incidentRoutes);

app.listen(port, () => {
  console.log(`🚨 Incident Service running on port ${port}`);
});
