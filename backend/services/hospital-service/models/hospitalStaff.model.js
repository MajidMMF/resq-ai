import mongoose from "mongoose";

const hospitalStaffSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
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
    role: {
      type: String,
      enum: ["doctor", "nurse", "admin"],
      default: "doctor",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "PENDING",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

hospitalStaffSchema.index({ hospitalId: 1, email: 1 }, { unique: true });

export const HospitalStaff = mongoose.model("HospitalStaff", hospitalStaffSchema);
export default HospitalStaff;

