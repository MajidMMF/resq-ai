import { Router } from "express";
import {
  getMyHospital,
  updateMyHospital,
  updateCapability,
  listAvailable,
  getHospitalInternal,
  getStaffByEmail,
  activateStaff,
  createHospitalInternal,
  approveHospital,
  suspendHospital,
  listHospitals,
  getHospital,
} from "../controllers/hospital.controller.js";
import { internalAuth, requireUserId } from "../middleware/internalAuth.js";
import {
  validateHospitalCreate,
  validateHospitalUpdate,
  validateCapabilityUpdate,
} from "../validators/hospital.validator.js";

const router = Router();

// ==========================================
// 1. STAFF ENDPOINTS (Require X-User-Id header)
// ==========================================
router.get("/me", requireUserId, getMyHospital);
router.patch("/me", requireUserId, validateHospitalUpdate, updateMyHospital);
router.patch("/me/capability", requireUserId, validateCapabilityUpdate, updateCapability);

// ==========================================
// 2. INTERNAL ENDPOINTS (Require X-Internal-Secret)
// ==========================================
router.get("/available", internalAuth, listAvailable);
router.get("/:id/internal", internalAuth, getHospitalInternal);
router.get("/staff/by-email/:email", internalAuth, getStaffByEmail);
router.patch("/staff/:id/activate", internalAuth, activateStaff);
router.post("/internal", internalAuth, validateHospitalCreate, createHospitalInternal);

// ==========================================
// 3. ADMIN ENDPOINTS (Approve/Suspend)
// ==========================================
router.patch("/:id/approve", internalAuth, approveHospital);
router.patch("/:id/suspend", internalAuth, suspendHospital);

// ==========================================
// 4. PUBLIC / GENERAL LOOKUP
// ==========================================
router.get("/", listHospitals);
router.get("/:id", getHospital);

export default router;

