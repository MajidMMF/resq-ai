import mongoose from "mongoose";

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  { _id: false }
);

const ambulanceSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["basic", "advanced", "icu"],
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    location: {
      type: pointSchema,
      default: () => ({ type: "Point", coordinates: [0, 0] }),
    },
    status: {
      type: String,
      enum: ["online", "offline", "busy"],
      default: "offline",
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLocationAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ambulanceSchema.index({ location: "2dsphere" });

export const Ambulance = mongoose.model("Ambulance", ambulanceSchema);
export default Ambulance;

