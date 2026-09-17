import { Router } from "express";
import { internalAuth, requireUserId } from "../middleware/internalAuth.js";
import * as ctrl from "../controllers/notification.controller.js";

const router = Router();

// ==========================================
// 1. INTERNAL ROUTE (X-Internal-Secret)
// Must be declared BEFORE /:id to avoid collision
// ==========================================
router.post("/create", internalAuth, ctrl.createNotification);

// ==========================================
// 2. USER ROUTES (Require X-User-Id header)
// Specific route paths BEFORE /:id parameter
// ==========================================
router.get("/", requireUserId, ctrl.listNotifications);
router.get("/unread-count", requireUserId, ctrl.getUnreadCount);
router.patch("/read-all", requireUserId, ctrl.markAllAsRead);
router.delete("/all", requireUserId, ctrl.deleteAll);

// Parameterized ID routes
router.patch("/:id/read", requireUserId, ctrl.markAsRead);
router.delete("/:id", requireUserId, ctrl.deleteNotification);

export default router;

