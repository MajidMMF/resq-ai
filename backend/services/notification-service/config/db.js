import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB connected (notification-service): ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error (notification-service):", error.message);
    process.exit(1);
  }
}

export default connectDB;

