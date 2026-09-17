import { z } from "zod";

const coordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const nearbyHospitalsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50000).default(5000), // Max 50km
});

export const routeSchema = z.object({
  from: coordSchema,
  to: coordSchema,
});

export const geocodeSchema = z.object({
  address: z.string().trim().min(2, "Address must be at least 2 characters"),
});

export const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const autocompleteSchema = z.object({
  query: z.string().trim().min(2, "Search query must be at least 2 characters"),
});

export const distanceSchema = z.object({
  from: coordSchema,
  to: coordSchema,
});

