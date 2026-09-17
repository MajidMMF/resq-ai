import mongoose from "mongoose";
import { env } from "./env.js";

export const initDB = async () => {
  try {
    if (!env.MONGODB_URI) {
      throw new Error("MONGODB_URI or MONGO_URI is not set in .env");
    }

    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ MongoDB connected for incident service");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
