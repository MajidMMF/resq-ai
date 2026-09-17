import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const updateStatusSchema = z.object({
  status: z.enum(["online", "offline", "busy"], {
    errorMap: () => ({ message: "Status must be 'online', 'offline', or 'busy'" }),
  }),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  incidentId: z.string().regex(objectIdRegex, "Invalid incidentId").optional().nullable(),
});

export const assignAmbulanceSchema = z.object({
  incidentId: z.string().regex(objectIdRegex, "Invalid incidentId"),
  userId: z.string().regex(objectIdRegex, "Invalid userId").optional().nullable(),
  hospitalId: z.string().regex(objectIdRegex, "Invalid hospitalId").optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("HIGH"),
  arrivalOtp: z.string().optional().nullable(),
});

export const rejectAssignmentSchema = z.object({
  reason: z.string().trim().max(300).optional().nullable(),
});

export const verifyOtpSchema = z.object({
  otp: z.string().trim().min(4).max(6, "OTP must be 4 digits"),
});

export const createAmbulanceSchema = z.object({
  plateNumber: z.string().trim().min(3).max(20).toUpperCase(),
  type: z.enum(["basic", "advanced", "icu"]),
  hospitalId: z.string().regex(objectIdRegex, "Invalid hospitalId").optional().nullable(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

export const updateAmbulanceProfileSchema = z.object({
  type: z.enum(["basic", "advanced", "icu"]).optional(),
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const availableQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(5000), // meters
});

