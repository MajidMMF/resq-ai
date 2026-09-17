import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8001;

connectDb();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "auth service healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/", authRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`✅ auth service running on port ${port}`);
});
