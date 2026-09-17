import { Router } from "express";
import { internalAuth } from "../middleware/internalAuth.js";
import {
  getNearbyHospitals,
  getRoute,
  geocode,
  reverseGeocode,
  autocomplete,
  getDistance,
} from "../controllers/location.controller.js";

const router = Router();

// Enforce internal service authentication across all location endpoints
router.use(internalAuth);

router.get("/hospitals", getNearbyHospitals);
router.post("/route", getRoute);
router.post("/geocode", geocode);
router.post("/reverse-geocode", reverseGeocode);
router.post("/autocomplete", autocomplete);
router.post("/distance", getDistance);

export default router;

