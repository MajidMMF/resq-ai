import fs from "fs/promises";
import { uploadToS3, getPresignedUrl } from "../services/s3.service.js";

export async function uploadImage(req, res) {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({
      success: false,
      code: "MISSING_USER",
      message: "X-User-Id header is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      code: "NO_FILE",
      message: "No image file provided",
    });
  }

  const { path: tempPath, originalname, mimetype } = req.file;

  try {
    const imageKey = await uploadToS3(tempPath, originalname, mimetype, userId);
    const imageUrl = await getPresignedUrl(imageKey, 3600);

    return res.status(200).json({
      success: true,
      data: {
        imageKey,
        imageUrl,
        expiresAt: Date.now() + 3600 * 1000,
      },
    });
  } catch (error) {
    console.error("uploadImage error:", error);
    return res.status(500).json({
      success: false,
      code: "UPLOAD_FAILED",
      message: "Image upload failed",
    });
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch (error) {
      console.warn("Temp file delete failed:", error.message);
    }
  }
}
