import mongoose from "mongoose";

const ROLE_VALUES = ["USER", "AMBULANCE_DRIVER", "HOSPITAL_STAFF", "ADMIN"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: /^\+?[1-9]\d{8,14}$/,
    },
    avatar: {
      type: String,
      default: "",
    },
    roles: {
      type: [String],
      enum: ROLE_VALUES,
      default: ["USER"],
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    profileCompleted: {
      type: Boolean,
      default: true,
    },
    firebaseUid: {
      type: String,
      sparse: true,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
