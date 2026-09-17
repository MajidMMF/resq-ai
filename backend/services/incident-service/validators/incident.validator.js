import { z } from "zod";

const locationObjectSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== "object") return val;
    const lat = val.latitude !== undefined ? val.latitude : val.lat;
    const lng = val.longitude !== undefined ? val.longitude : val.lng;
    const accuracy = val.accuracy !== undefined ? val.accuracy : null;
    return {
      latitude: lat !== undefined ? Number(lat) : undefined,
      longitude: lng !== undefined ? Number(lng) : undefined,
      accuracy: accuracy !== null && accuracy !== undefined ? Number(accuracy) : null,
    };
  },
  z.object({
    latitude: z.number({ required_error: "Latitude is required" }),
    longitude: z.number({ required_error: "Longitude is required" }),
    accuracy: z.number().nullable().optional(),
  })
);

export const createIncidentSchema = z.object({
  description: z.string().trim().max(500).nullable().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().nullable().optional(),
  }),
  location: locationObjectSchema,
  imageKey: z.string().trim().min(1).nullable().optional(),
});

export const cancelIncidentSchema = z.object({
  reason: z.string().trim().max(300).nullable().optional(),
});

export const updateStatusSchema = z.object({
  status: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const validateImageKey = (imageKey) => {
  if (!imageKey) {
    return true;
  }

  return /^incidents\/[^/]+\/.+/.test(imageKey);
};
