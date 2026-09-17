import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.warn(
    "⚠️  AWS S3 credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  );
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET;