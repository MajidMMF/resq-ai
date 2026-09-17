import { z } from "zod";

const mobileRegex = /^\+?[1-9]\d{8,14}$/;

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(64, "Password must be at most 64 characters"),
  mobile: z
    .union([z.string(), z.number()])
    .transform((value) => {
      let clean = String(value).replace(/[\s\-\(\)]/g, "").trim();
      if (clean.startsWith("0") && clean.length === 11) {
        clean = "+91" + clean.slice(1);
      } else if (!clean.startsWith("+") && clean.length === 10) {
        clean = "+91" + clean;
      }
      return clean;
    })
    .refine((value) => /^\+?[1-9]\d{8,14}$/.test(value), "Invalid mobile number"),
  role: z
    .enum(["USER", "AMBULANCE_DRIVER", "HOSPITAL_STAFF", "ADMIN"])
    .optional()
    .default("USER"),
  ambulance: z
    .object({
      plateNumber: z.string().optional(),
      type: z.enum(["basic", "advanced", "icu"]).optional(),
    })
    .optional(),
  hospital: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      address: z.any().optional(),
      location: z.any().optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});
