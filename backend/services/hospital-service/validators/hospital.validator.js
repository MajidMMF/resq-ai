import { z } from "zod";

export const CoordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const UpdateHospitalSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  address: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email format").optional().nullable(),
  location: z.any().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  operatingHours: z.string().trim().max(200).optional(),
  emergencyDepartmentOpen: z.boolean().optional(),
});

export const UpdateCapabilitySchema = z.object({
  beds: z.coerce.number().int().min(0).nullable().optional(),
  icu: z.coerce.number().int().min(0).nullable().optional(),
  trauma: z.boolean().nullable().optional(),
  ventilators: z.coerce.number().int().min(0).nullable().optional(),
});

export const CreateHospitalSchema = z.object({
  name: z.string().trim().min(2).max(100, "Name is required"),
  address: z.string().trim().min(5).max(300, "Address is required"),
  location: CoordSchema,
  phone: z.string().trim().min(5).max(20, "Phone is required"),
  email: z.string().trim().email("Valid hospital email is required"),
  staffEmail: z.string().trim().email("Valid admin/staff email is required"),
  createdBy: z.string().optional().nullable(),
});

export const AvailableQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50000).default(10000), // In meters (default 10km)
});

export const ActivateStaffSchema = z.object({
  userId: z.string().optional().nullable(),
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const AcceptIncomingSchema = z.object({
  estimatedPreparationTimeMinutes: z.coerce.number().int().min(1).max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const MarkReadySchema = z.object({
  allocatedBed: z.string().trim().max(50).optional(),
  teamLead: z.string().trim().max(100).optional(),
  readyDetails: z.string().trim().max(500).optional(),
});

export const MarkUnavailableSchema = z.object({
  reason: z.string().trim().min(2).max(300),
  diversionSuggestion: z.string().trim().max(300).optional(),
});

export const validateHospitalCreate = (req, res, next) => {
  const parsed = CreateHospitalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
  }
  req.body = parsed.data;
  next();
};

export const validateHospitalUpdate = (req, res, next) => {
  const parsed = UpdateHospitalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
  }
  req.body = parsed.data;
  next();
};

export const validateCapabilityUpdate = (req, res, next) => {
  const parsed = UpdateCapabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
  }
  req.body = parsed.data;
  next();
};

export const validateAcceptIncoming = (req, res, next) => {
  const parsed = AcceptIncomingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
  }
  req.body = parsed.data;
  next();
};

export const validateMarkReady = (req, res, next) => {
  const parsed = MarkReadySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
  }
  req.body = parsed.data;
  next();
};

export const validateMarkUnavailable = (req, res, next) => {
  const parsed = MarkUnavailableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
  }
  req.body = parsed.data;
  next();
};


