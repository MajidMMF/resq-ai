import mongoose from "mongoose";

const ambulanceLocationSchema = new mongoose.Schema(
  {
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
      required: true,
      index: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: null },
      heading: { type: Number, default: null },
      speed: { type: Number, default: null },
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

ambulanceLocationSchema.index({ ambulanceId: 1, recordedAt: -1 });
// 30 days TTL index
ambulanceLocationSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 2592000 });

export const AmbulanceLocation = mongoose.model(
  "AmbulanceLocation",
  ambulanceLocationSchema
);
export default AmbulanceLocation;

