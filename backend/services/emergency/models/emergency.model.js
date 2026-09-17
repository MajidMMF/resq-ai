import mongoose from "mongoose";
import { EMERGENCY_STATES } from "../../../shared/constants/emergencyStates.js";

const pointSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const emergencySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    state: {
      type: String,
      enum: Object.values(EMERGENCY_STATES),
      default: EMERGENCY_STATES.USER_REQUESTED,
      required: true,
      index: true,
    },
    pickupLocation: {
      type: pointSchema,
      required: true,
    },
    patientImage: {
      storage: {
        type: String,
        enum: ["TEMPORARY", "S3", "NONE"],
        default: "NONE",
      },
      key: {
        type: String,
        trim: true,
        default: "",
      },
      url: {
        type: String,
        trim: true,
        default: "",
      },
    },
    aiAnalysis: {
      observedConditions: {
        type: [String],
        default: [],
      },
      possibleUrgency: {
        type: String,
        trim: true,
        default: "",
      },
      immediateSafeSteps: {
        type: [String],
        default: [],
      },
      thingsToAvoid: {
        type: [String],
        default: [],
      },
      ambulanceWaitingGuidance: {
        type: [String],
        default: [],
      },
      limitations: {
        type: String,
        trim: true,
        default: "",
      },
    },
    selectedHospital: {
      hospitalId: {
        type: String,
        trim: true,
        default: "",
      },
      placeId: {
        type: String,
        trim: true,
        default: "",
      },
      name: {
        type: String,
        trim: true,
        default: "",
      },
      location: pointSchema,
      selectedAt: Date,
    },
    assignedAmbulance: {
      ambulanceId: {
        type: String,
        trim: true,
        default: "",
      },
      displayName: {
        type: String,
        trim: true,
        default: "",
      },
      assignedAt: Date,
      acceptedAt: Date,
    },
    otpVerification: {
      verified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
    },
    stateHistory: [
      {
        from: String,
        to: String,
        actorRole: String,
        actorId: String,
        reason: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

const Emergency = mongoose.model("Emergency", emergencySchema);
export default Emergency;
