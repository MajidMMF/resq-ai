import mongoose from "mongoose";

const hospitalCapabilitySchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      unique: true,
      index: true,
    },
    beds: {
      type: Number,
      default: null,
    },
    icu: {
      type: Number,
      default: null,
    },
    trauma: {
      type: Boolean,
      default: null,
    },
    ventilators: {
      type: Number,
      default: null,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

export const HospitalCapability = mongoose.model(
  "HospitalCapability",
  hospitalCapabilitySchema
);
export default HospitalCapability;

