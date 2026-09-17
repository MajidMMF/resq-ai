import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createNotificationSchema = z.object({
  userId: z.string().regex(objectIdRegex, "Invalid userId format (must be 24-char ObjectId)"),
  type: z.string().trim().min(2, "Type must be at least 2 characters").max(60, "Type cannot exceed 60 characters"),
  title: z.string().trim().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  body: z.string().trim().min(1, "Body is required").max(500, "Body cannot exceed 500 characters"),
  data: z.record(z.any()).optional().default({}),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  read: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

