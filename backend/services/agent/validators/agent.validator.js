import { z } from "zod";

export const analyzeIncidentSchema = z.object({
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  incidentId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const chatMessageSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt cannot be empty"),
  incidentId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
});

