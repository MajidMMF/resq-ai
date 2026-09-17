import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "../config/s3.js";

export const getFromS3 = async (fileName, expiresIn = 600) => {
  try {
    if (!S3_BUCKET) {
      throw new Error("S3_BUCKET is not configured");
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    const url = await getSignedUrl(s3, command, { expiresIn });

    return url;
  } catch (error) {
    console.error("getFromS3 error:", error.message);
    throw error;
  }
};