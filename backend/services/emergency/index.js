import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import router from "./routes/emergency.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8002;

connectDb();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use("/", router);

app.get("/health", (_req, res) => {
  res.json({
    message: "emergency service healthy",
  });
});

app.listen(port, () => {
  console.log("✅ emergency service is running on port:", port);
});
