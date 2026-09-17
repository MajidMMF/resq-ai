import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI or MONGODB_URI is not set in .env");
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected (resq_auth)");
    try {
      await mongoose.connection.collection("users").dropIndex("firebaseUid_1");
    } catch (e) {
      // already dropped or not present
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
