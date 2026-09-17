import express from "express";
import {
  assignAmbulance,
  createEmergency,
  getEmergency,
  selectHospital,
  transitionEmergency,
} from "../controllers/emergency.controller.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { authenticate, authorize } from "../../../shared/middleware/sessionAuth.js";

const router = express.Router();

router.post("/", authenticate, authorize(ROLES.USER), createEmergency);
router.get("/:id", authenticate, getEmergency);
router.patch("/:id/hospital", authenticate, authorize(ROLES.USER), selectHospital);
router.patch("/:id/ambulance", authenticate, authorize(ROLES.USER), assignAmbulance);
router.patch(
  "/:id/state",
  authenticate,
  authorize(ROLES.USER, ROLES.AMBULANCE, ROLES.HOSPITAL, ROLES.ADMIN),
  transitionEmergency
);

export default router;
