import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET } from "../config/s3.js";

export async function uploadToS3(localFilePath, originalName, mimetype, userId) {
  const ext = path.extname(originalName) || ".jpg";
  const key = `incidents/${userId}/${crypto.randomUUID()}${ext}`;

  const fileBuffer = await fs.readFile(localFilePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    })
  );

  return key;
}

export async function getPresignedUrl(key, expiresIn = 3600) {
  if (!key) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}
