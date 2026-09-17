import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: null },
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: null,
      maxlength: 500,
    },
    imageKey: {
      type: String,
      default: null,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    incidentType: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      default: null,
    },
    aiAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    selectedHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    assignedAmbulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    assignedAmbulanceDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    arrivalOtp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "ANALYZING",
        "READY",
        "HOSPITAL_SELECTED",
        "AMBULANCE_REQUESTED",
        "AMBULANCE_ASSIGNED",
        "AMBULANCE_ACCEPTED",
        "EN_ROUTE",
        "HOSPITAL_ACCEPTED",
        "HOSPITAL_READY",
        "ARRIVED",
        "RESOLVED",
        "CANCELLED",
        "REJECTED",
        "TIMEOUT",
        "NO_AMBULANCE",
        "HOSPITAL_UNAVAILABLE",
      ],
      required: true,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

incidentSchema.index({ reporterId: 1, createdAt: -1 });

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident;
