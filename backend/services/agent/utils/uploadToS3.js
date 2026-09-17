import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "../config/s3.js";

export const uploadToS3 = async (fileName, buffer, contentType) => {
  try {
    if (!S3_BUCKET) {
      throw new Error("S3_BUCKET is not configured");
    }

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    return fileName;
  } catch (error) {
    console.error("uploadToS3 error:", error.message);
    throw error;
  }
};