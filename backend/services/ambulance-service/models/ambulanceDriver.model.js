import mongoose from "mongoose";

const ambulanceDriverSchema = new mongoose.Schema(
  {
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "PENDING",
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ambulanceDriverSchema.index({ ambulanceId: 1, email: 1 }, { unique: true });

export const AmbulanceDriver = mongoose.model("AmbulanceDriver", ambulanceDriverSchema);
export default AmbulanceDriver;

