import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { env } from "../config/env.js";

if (!fs.existsSync(env.UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(env.UPLOAD_TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_TEMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("INVALID_FILE_TYPE"));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});
