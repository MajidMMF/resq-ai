import { Router } from "express";
import { upload } from "../middleware/upload.middleware.js";
import { internalAuth } from "../middleware/internalAuth.js";
import { uploadImage } from "../controllers/upload.controller.js";
import {
  createIncident,
  listMyIncidents,
  getIncident,
  getTimeline,
  cancelIncident,
  updateStatus,
  selectHospital,
  requestAmbulance,
} from "../controllers/incident.controller.js";

const router = Router();

router.post("/upload-image", upload.single("image"), uploadImage);
router.post("/", createIncident);
router.get("/", listMyIncidents);

// Status Update endpoints (Internal microservice calls)
router.patch("/:id/status", internalAuth, updateStatus);
router.post("/:id/status", internalAuth, updateStatus);

// Generic ID routes
router.post("/:id/select-hospital", selectHospital);
router.post("/:id/request-ambulance", requestAmbulance);
router.post("/:id/cancel", cancelIncident);
router.get("/:id", getIncident);
router.get("/:id/timeline", getTimeline);

export default router;
