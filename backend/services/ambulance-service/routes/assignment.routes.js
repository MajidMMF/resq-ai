import { Router } from "express";
import { requireUserId } from "../middleware/internalAuth.js";
import {
  listAssignments,
  acceptAssignment,
  rejectAssignment,
  startTrip,
  arrive,
  verifyArrivalOtp,
  resendArrivalOtp,
  completeTrip,
} from "../controllers/assignment.controller.js";

const router = Router();

router.use(requireUserId);

router.get("/", listAssignments);
router.post("/:id/accept", acceptAssignment);
router.post("/:id/reject", rejectAssignment);
router.post("/:id/start", startTrip);
router.post("/:id/arrive", arrive);
router.post("/:id/verify-otp", verifyArrivalOtp);
router.post("/:id/resend-otp", resendArrivalOtp);
router.post("/:id/complete", completeTrip);

export default router;

