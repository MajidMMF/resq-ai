import { Router } from "express";
import { internalAuth, requireUserId } from "../middleware/internalAuth.js";
import {
  getMe,
  updateMe,
  updateStatus,
  updateLocation,
  getAvailableAmbulances,
  getDriverByEmail,
  activateDriver,
  assignAmbulance,
  getAmbulanceInternal,
  listAmbulances,
  getAmbulance,
  approveAmbulance,
  suspendAmbulance,
  createAmbulanceInternal,
} from "../controllers/ambulance.controller.js";

const router = Router();

/* ──────────────────────────────────────────
   DRIVER-FACING ROUTES (X-User-Id)
   ────────────────────────────────────────── */
router.get("/me", requireUserId, getMe);
router.patch("/me", requireUserId, updateMe);
router.patch("/me/status", requireUserId, updateStatus);
router.patch("/me/location", requireUserId, updateLocation);

/* ──────────────────────────────────────────
   INTERNAL SERVICE ROUTES (X-Internal-Secret)
   ────────────────────────────────────────── */
router.post("/internal", internalAuth, createAmbulanceInternal);
router.get("/available", internalAuth, getAvailableAmbulances);
router.get("/drivers/by-email/:email", internalAuth, getDriverByEmail);
router.patch("/drivers/:id/activate", internalAuth, activateDriver);
router.post("/:id/assign", internalAuth, assignAmbulance);
router.get("/:id/internal", internalAuth, getAmbulanceInternal);

/* ──────────────────────────────────────────
   ADMIN ROUTES
   ────────────────────────────────────────── */
router.get("/", listAmbulances);
router.get("/:id", getAmbulance);
router.patch("/:id/approve", approveAmbulance);
router.patch("/:id/suspend", suspendAmbulance);

export default router;

