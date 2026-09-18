import mongoose from "mongoose";
import AmbulanceAssignment from "../models/ambulanceAssignment.model.js";
import Ambulance from "../models/ambulance.model.js";
import redis from "../config/redis.js";
import { getDriverAndAmbulance } from "./ambulance.controller.js";
import {
  generateOtp,
  saveOtp,
  verifyOtp as verifyOtpService,
  clearOtp,
} from "../services/otp.service.js";
import {
  notifyIncident,
  broadcastToIncident,
  broadcastToUser,
  broadcastToHospital,
} from "../services/notify.service.js";
import { rejectAssignmentSchema, verifyOtpSchema } from "../validators/ambulance.validator.js";

const STATUS_TTL = 10 * 60; // 10 minutes

/**
 * Helper to fetch and verify assignment ownership by the logged in driver
 */
async function getOwnedAssignment(assignmentId, userId, userEmail) {
  const data = await getDriverAndAmbulance(userId, userEmail);
  if (!data || !data.ambulance) {
    return { error: { status: 404, code: "NOT_FOUND", message: "Ambulance not found for this driver" } };
  }

  const assignment = await AmbulanceAssignment.findById(assignmentId);
  if (!assignment) {
    return { error: { status: 404, code: "ASSIGNMENT_NOT_FOUND", message: "Assignment not found" } };
  }

  if (assignment.ambulanceId.toString() !== data.ambulance._id.toString()) {
    return { error: { status: 403, code: "FORBIDDEN", message: "Assignment does not belong to your ambulance" } };
  }

  return { assignment, ambulance: data.ambulance, driver: data.driver };
}

/* ──────────────────────────────────────────
   LIST DRIVER ASSIGNMENTS
   ────────────────────────────────────────── */
export const listAssignments = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const userEmail = req.headers["x-user-email"];
    const data = await getDriverAndAmbulance(userId, userEmail);

    if (!data || !data.ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Driver profile not found",
      });
    }

    const assignments = await AmbulanceAssignment.find({
      ambulanceId: data.ambulance._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   ACCEPT ASSIGNMENT
   ────────────────────────────────────────── */
export const acceptAssignment = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (assignment.status !== "REQUESTED") {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: `Cannot accept assignment in '${assignment.status}' status`,
      });
    }

    // Generate 4-digit arrival OTP upon driver acceptance
    let plainOtp = null;
    let hash = assignment.arrivalOtpHash;
    let expiresAt = assignment.arrivalOtpExpiresAt;

    if (!hash || !expiresAt || expiresAt < new Date()) {
      plainOtp = await generateOtp();
      const saved = await saveOtp(assignment._id, plainOtp);
      hash = saved.hash;
      expiresAt = saved.expiresAt;
      assignment.arrivalOtpHash = hash;
      assignment.arrivalOtpExpiresAt = expiresAt;
      assignment.arrivalOtpAttempts = 0;
    }

    assignment.status = "ACCEPTED";
    assignment.acceptedAt = new Date();
    await assignment.save();

    // Set ambulance status to busy in DB & Redis
    ambulance.status = "busy";
    await ambulance.save();
    await redis.set(`ambulance:status:${ambulance._id}`, "busy", "EX", STATUS_TTL);

    // Emit socket event: ambulance:accepted → incident:{incidentId}
    const socketPayload = {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      acceptedAt: assignment.acceptedAt,
    };
    if (plainOtp) {
      socketPayload.arrivalOtp = plainOtp;
      socketPayload.otp = plainOtp;
    }
    broadcastToIncident(assignment.incidentId, "ambulance:accepted", socketPayload);
    if (assignment.userId) {
      broadcastToUser(assignment.userId, "ambulance:accepted", socketPayload);
    }

    // Notify incident-service HTTP
    const notifyPayload = {
      ambulanceId: ambulance._id,
      acceptedAt: assignment.acceptedAt,
    };
    if (plainOtp) {
      notifyPayload.arrivalOtp = plainOtp;
      notifyPayload.otpExpiresAt = expiresAt;
    }
    await notifyIncident(assignment.incidentId, "AMBULANCE_ACCEPTED", notifyPayload);

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   REJECT ASSIGNMENT
   ────────────────────────────────────────── */
export const rejectAssignment = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;
    const payload = rejectAssignmentSchema.parse(req.body);

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (assignment.status !== "REQUESTED") {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: `Cannot reject assignment in '${assignment.status}' status`,
      });
    }

    assignment.status = "REJECTED";
    assignment.rejectedAt = new Date();
    assignment.rejectionReason = payload.reason || "Driver rejected request";
    await assignment.save();

    // Revert ambulance status to online
    ambulance.status = "online";
    await ambulance.save();
    await redis.set(`ambulance:status:${ambulance._id}`, "online", "EX", STATUS_TTL);
    await redis.del(`ambulance:active:${ambulance._id}`);

    // Emit socket event: ambulance:rejected → incident:{incidentId}
    broadcastToIncident(assignment.incidentId, "ambulance:rejected", {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      reason: assignment.rejectionReason,
    });

    // Notify incident-service HTTP
    await notifyIncident(assignment.incidentId, "AMBULANCE_REQUESTED", {
      rejectedBy: ambulance._id,
      rejectionReason: assignment.rejectionReason,
    });

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   START TRIP (Driver starts driving to scene)
   ────────────────────────────────────────── */
export const startTrip = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (assignment.status !== "ACCEPTED") {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: `Cannot start trip. Current status is '${assignment.status}', expected 'ACCEPTED'`,
      });
    }

    assignment.status = "EN_ROUTE";
    assignment.startedAt = new Date();
    await assignment.save();

    // Emit socket: ambulance:en_route → incident:{incidentId}
    broadcastToIncident(assignment.incidentId, "ambulance:en_route", {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      startedAt: assignment.startedAt,
    });

    // Notify incident-service HTTP
    await notifyIncident(assignment.incidentId, "EN_ROUTE", {
      ambulanceId: ambulance._id,
      startedAt: assignment.startedAt,
    });

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   ARRIVE (Driver arrives at scene → generates OTP for user)
   ────────────────────────────────────────── */
export const arrive = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (assignment.status !== "EN_ROUTE") {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: `Cannot mark arrived from '${assignment.status}' status. Must be 'EN_ROUTE'`,
      });
    }

    // 1. Generate 4-digit OTP only if not already set or expired
    let plainOtp = null;
    let hash = assignment.arrivalOtpHash;
    let expiresAt = assignment.arrivalOtpExpiresAt;

    if (!hash || !expiresAt || expiresAt < new Date()) {
      plainOtp = await generateOtp();
      const saved = await saveOtp(assignment._id, plainOtp);
      hash = saved.hash;
      expiresAt = saved.expiresAt;
      assignment.arrivalOtpHash = hash;
      assignment.arrivalOtpExpiresAt = expiresAt;
    }

    // 2. Save arrival details in Assignment document
    assignment.status = "ARRIVED";
    assignment.arrivedAt = new Date();
    assignment.arrivalOtpAttempts = 0;
    await assignment.save();

    // 3. Notify incident-service via HTTP
    const notifyPayload = { otpExpiresAt: expiresAt };
    if (plainOtp) {
      notifyPayload.arrivalOtp = plainOtp;
    }
    await notifyIncident(assignment.incidentId, "ARRIVED", notifyPayload);

    // 4. Emit socket event: ambulance:arrived to incident, user, and hospital
    const socketPayload = {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      expiresAt,
    };
    if (plainOtp) {
      socketPayload.otp = plainOtp;
    }

    broadcastToIncident(assignment.incidentId, "ambulance:arrived", socketPayload);
    if (assignment.userId) {
      broadcastToUser(assignment.userId, "ambulance:arrived", socketPayload);
    }
    if (assignment.hospitalId) {
      broadcastToHospital(assignment.hospitalId, "ambulance:arrived", socketPayload);
    }

    // 6. Return response to driver WITHOUT the OTP
    return res.status(200).json({
      success: true,
      status: "ARRIVED",
      otpRequired: true,
      message: "Arrived at destination. Ask user for arrival verification OTP.",
      data: {
        assignmentId: assignment._id,
        arrivedAt: assignment.arrivedAt,
        otpExpiresAt: expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   VERIFY OTP (Driver inputs OTP given by user)
   ────────────────────────────────────────── */
export const verifyArrivalOtp = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;
    const { otp } = verifyOtpSchema.parse(req.body);

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (assignment.status !== "ARRIVED") {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: `Cannot verify OTP. Current status is '${assignment.status}', expected 'ARRIVED'`,
      });
    }

    // Verify OTP using service
    const verifyResult = await verifyOtpService(assignment._id, otp, assignment);

    if (!verifyResult.ok) {
      return res.status(400).json({
        success: false,
        code: verifyResult.code,
        message: verifyResult.message,
        attemptsLeft: verifyResult.attemptsLeft,
      });
    }

    // OTP verified successfully
    assignment.status = "OTP_VERIFIED";
    assignment.arrivalOtpVerifiedAt = new Date();
    await assignment.save();

    // Automatically transition to EN_ROUTE (to hospital)
    assignment.status = "EN_ROUTE";
    await assignment.save();

    // Clear OTP from Redis
    await clearOtp(assignment._id);

    // Emit socket event: ambulance:otp_verified
    const otpVerifiedPayload = {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      status: "EN_ROUTE",
      verifiedAt: assignment.arrivalOtpVerifiedAt,
    };
    broadcastToIncident(assignment.incidentId, "ambulance:otp_verified", otpVerifiedPayload);
    broadcastToIncident(assignment.incidentId, "incident:status_updated", otpVerifiedPayload);
    if (assignment.userId) {
      broadcastToUser(assignment.userId, "ambulance:otp_verified", otpVerifiedPayload);
      broadcastToUser(assignment.userId, "incident:status_updated", otpVerifiedPayload);
    }

    // Notify incident-service
    await notifyIncident(assignment.incidentId, "EN_ROUTE", {
      otpVerified: true,
      verifiedAt: assignment.arrivalOtpVerifiedAt,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. En route to hospital.",
      data: assignment,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   RESEND OTP (Optional helper)
   ────────────────────────────────────────── */
export const resendArrivalOtp = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (assignment.status !== "ARRIVED") {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: "Cannot resend OTP unless ambulance status is 'ARRIVED'",
      });
    }

    const newOtp = await generateOtp();
    const { hash, expiresAt } = await saveOtp(assignment._id, newOtp);

    assignment.arrivalOtpHash = hash;
    assignment.arrivalOtpExpiresAt = expiresAt;
    assignment.arrivalOtpAttempts = 0;
    await assignment.save();

    const socketPayload = {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      otp: newOtp,
      expiresAt,
    };

    broadcastToIncident(assignment.incidentId, "ambulance:arrived", socketPayload);
    if (assignment.userId) {
      broadcastToUser(assignment.userId, "ambulance:arrived", socketPayload);
    }

    return res.status(200).json({
      success: true,
      message: "A new OTP has been generated and dispatched to the reporting user.",
      otpRequired: true,
      expiresAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   COMPLETE TRIP (Patient delivered to hospital)
   ────────────────────────────────────────── */
export const completeTrip = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const { id } = req.params;

    const result = await getOwnedAssignment(id, userId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { assignment, ambulance } = result;

    if (!["EN_ROUTE", "ARRIVED", "OTP_VERIFIED"].includes(assignment.status)) {
      return res.status(409).json({
        success: false,
        code: "INVALID_STATE",
        message: `Cannot complete assignment in '${assignment.status}' status`,
      });
    }

    assignment.status = "COMPLETED";
    assignment.completedAt = new Date();
    await assignment.save();

    // Reset ambulance to online
    ambulance.status = "online";
    await ambulance.save();

    await redis.set(`ambulance:status:${ambulance._id}`, "online", "EX", STATUS_TTL);
    await redis.del(`ambulance:active:${ambulance._id}`);

    // Emit socket event: ambulance:completed & incident:status_updated → incident:{incidentId}
    const completionPayload = {
      incidentId: assignment.incidentId,
      ambulanceId: ambulance._id,
      status: "RESOLVED",
      completedAt: assignment.completedAt,
    };
    broadcastToIncident(assignment.incidentId, "ambulance:completed", completionPayload);
    broadcastToIncident(assignment.incidentId, "incident:status_updated", completionPayload);
    if (assignment.userId) {
      broadcastToUser(assignment.userId, "ambulance:completed", completionPayload);
      broadcastToUser(assignment.userId, "incident:status_updated", completionPayload);
    }

    // Notify incident-service HTTP
    await notifyIncident(assignment.incidentId, "RESOLVED", {
      completedBy: ambulance._id,
      completedAt: assignment.completedAt,
    });

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

