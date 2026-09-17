import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ emergency database connected successfully ✅");
  } catch (error) {
    console.error("Emergency database connection failed:", error);
    process.exitCode = 1;
  }
};
