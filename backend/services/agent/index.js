import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import router from "./routes/agent.route.js";

dotenv.config();
const port = process.env.PORT || 8004;
const app = express();

app.use(express.json({ limit: "10mb" }));

connectDb();

// Mount routes with and without prefixes for maximum gateway compatibility
app.use("/api/agent", router);
app.use("/api/ai", router);
app.use("/", router);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "agent-service",
    message: "ResQ AI Agent Service running",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Agent service error:", err);

  if (err?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: err.errors?.[0]?.message || "Invalid payload",
      errors: err.errors,
    });
  }

  if (err?.status) {
    return res.status(err.status).json(
      err.data || {
        success: false,
        code: "AGENT_ERROR",
        message: err.message || "Agent error",
      }
    );
  }

  return res.status(500).json({
    success: false,
    code: "AGENT_INTERNAL_ERROR",
    message: `agent error: ${err?.message || "Unknown error"}`,
  });
});

app.listen(port, () => {
  console.log(" ✅ agent service is running on port", port);
});
