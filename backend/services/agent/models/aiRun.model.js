import mongoose from "mongoose";

const aiRunSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["RUNNING", "COMPLETED", "FAILED"],
      default: "RUNNING",
      index: true,
    },
    steps: [
      {
        name: String,
        status: String,
        model: String,
        durationMs: Number,
        startedAt: Date,
        endedAt: Date,
      },
    ],
    totalDurationMs: Number,
    error: String,
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

const AIRun = mongoose.model("AIRun", aiRunSchema);

export default AIRun;