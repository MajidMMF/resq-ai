import { Router } from "express";
import {
  getIncoming,
  acceptIncoming,
  markReady,
  markUnavailable,
  getActivePatients,
  getPatientHistory,
} from "../controllers/incoming.controller.js";
import { requireUserId } from "../middleware/internalAuth.js";
import {
  validateAcceptIncoming,
  validateMarkReady,
  validateMarkUnavailable,
} from "../validators/hospital.validator.js";

const router = Router();

// All incoming routes are staff actions, requiring X-User-Id
router.use(requireUserId);

router.get("/incoming", getIncoming);
router.post("/incoming/:incidentId/accept", validateAcceptIncoming, acceptIncoming);
router.post("/incoming/:incidentId/ready", validateMarkReady, markReady);
router.post("/incoming/:incidentId/unavailable", validateMarkUnavailable, markUnavailable);
router.get("/active", getActivePatients);
router.get("/history", getPatientHistory);

export default router;

