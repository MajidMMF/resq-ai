import mongoose from "mongoose";

const incidentEventSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

incidentEventSchema.index({ incidentId: 1, createdAt: 1 });

const IncidentEvent = mongoose.model("IncidentEvent", incidentEventSchema);

export default IncidentEvent;
