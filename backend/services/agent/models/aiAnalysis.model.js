import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    runId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIRun",
    },
    vision: {
      sceneType: String,
      visibleObservations: [String],
      urgencyIndicators: [String],
      confidence: Number,
    },
    incident: {
      type: String,
      priority: String,
      confidence: Number,
    },
    triage: {
      urgencyGuidance: String,
      safeFirstResponse: [String],
      dangerWarnings: [String],
    },
    summary: String,
    confidence: Number,
    medicalDisclaimer: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AIAnalysis = mongoose.model("AIAnalysis", aiAnalysisSchema);

export default AIAnalysis;