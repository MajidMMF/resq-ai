import mongoose from "mongoose";

const ambulanceAssignmentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AmbulanceDriver",
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true, // The reporting user (for OTP delivery and alerts)
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ACCEPTED",
        "REJECTED",
        "EN_ROUTE",
        "ARRIVED",
        "OTP_VERIFIED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "REQUESTED",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    // OTP Fields for arrival verification
    arrivalOtpHash: {
      type: String,
      default: null,
    },
    arrivalOtpExpiresAt: {
      type: Date,
      default: null,
    },
    arrivalOtpAttempts: {
      type: Number,
      default: 0,
    },
    arrivalOtpVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ambulanceAssignmentSchema.index({ incidentId: 1, status: 1 });

export const AmbulanceAssignment = mongoose.model(
  "AmbulanceAssignment",
  ambulanceAssignmentSchema
);
export default AmbulanceAssignment;

