import { Router } from "express";
import { analyzeIncident, chat, getMessages } from "../controllers/agent.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { internalAuth } from "../middleware/internalAuth.js";

const router = Router();

router.get("/messages/:incidentId", internalAuth, getMessages);
router.get("/chat/messages/:incidentId", internalAuth, getMessages);
router.post("/analyze", internalAuth, upload.single("image"), analyzeIncident);
router.post("/chat", internalAuth, chat);

export default router;
