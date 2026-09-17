import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 8003,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  AWS_REGION: process.env.AWS_REGION || "ap-south-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET: process.env.S3_BUCKET,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET || "change-this-to-random-string",
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  UPLOAD_TEMP_DIR: process.env.UPLOAD_TEMP_DIR || "/tmp/resq-uploads",
};
