import axios from "axios";
import HospitalStaff from "../models/hospitalStaff.model.js";
import { env } from "../config/env.js";
import {
  notifyIncident,
  broadcastToIncident,
  broadcastToHospital,
  broadcastToAdmin,
} from "../services/notify.service.js";

const getActiveStaff = async (reqOrUserId) => {
  const userId =
    typeof reqOrUserId === "object"
      ? reqOrUserId.userId || reqOrUserId.headers?.["x-user-id"]
      : reqOrUserId;
  const userEmail = typeof reqOrUserId === "object" ? reqOrUserId.headers?.["x-user-email"] : null;

  let staff = null;
  if (userId) {
    staff = await HospitalStaff.findOne({
      userId: { $in: [userId, String(userId)] },
      $or: [{ isActive: true }, { status: "ACTIVE" }],
    });
  }

  if (!staff && userEmail) {
    staff = await HospitalStaff.findOne({
      email: userEmail.toLowerCase(),
      status: { $ne: "SUSPENDED" },
    });
    if (staff && userId && !staff.userId) {
      staff.userId = userId;
      staff.isActive = true;
      await staff.save();
    }
  }

  return staff;
};

/**
 * GET /me/incoming - List incidents assigned to this hospital with incoming/accepted/ready status
 */
export const getIncoming = async (req, res) => {
  try {
    const staff = await getActiveStaff(req);
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    // Call Incident Service to get active incidents destined for this hospital
    try {
      const response = await axios.get(`${env.INCIDENT_SERVICE}/api/incidents`, {
        params: {
          hospitalId: staff.hospitalId.toString(),
          status: "HOSPITAL_SELECTED,HOSPITAL_ASSIGNED,HOSPITAL_ACCEPTED,HOSPITAL_READY,EN_ROUTE_HOSPITAL,IN_TRANSIT,AMBULANCE_REQUESTED,AMBULANCE_ACCEPTED,ARRIVED",
        },
        headers: { "x-internal-secret": env.INTERNAL_SECRET },
        timeout: 5000,
      });

      return res.status(200).json({
        success: true,
        data: response.data.data || response.data || [],
      });
    } catch (incidentErr) {
      console.warn(
        "[getIncoming] Could not fetch incidents from Incident Service:",
        incidentErr.message
      );
      return res.status(200).json({
        success: true,
        data: [],
        warning: "Could not reach Incident Service, returning empty list",
      });
    }
  } catch (error) {
    console.error("[getIncoming] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /me/incoming/:incidentId/accept - Accept incoming patient
 */
export const acceptIncoming = async (req, res) => {
  try {
    const staff = await getActiveStaff(req);
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    const { incidentId } = req.params;
    const { estimatedPreparationTimeMinutes, notes } = req.body;

    const payload = {
      hospitalId: staff.hospitalId,
      acceptedBy: staff._id,
      staffName: staff.name,
      estimatedPreparationTimeMinutes: estimatedPreparationTimeMinutes || 5,
      notes: notes || "",
      acceptedAt: new Date().toISOString(),
    };

    // 1. Update status in Incident Service
    await notifyIncident(incidentId, "HOSPITAL_ACCEPTED", payload);

    // 2. Broadcast socket events
    broadcastToIncident(incidentId, "hospital:accepted", payload);
    broadcastToHospital(staff.hospitalId, "hospital:accepted", { incidentId, ...payload });
    broadcastToAdmin("hospital:accepted", { incidentId, ...payload });

    return res.status(200).json({
      success: true,
      message: "Patient acceptance recorded",
      data: payload,
    });
  } catch (error) {
    console.error("[acceptIncoming] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /me/incoming/:incidentId/ready - Mark trauma/emergency team ready
 */
export const markReady = async (req, res) => {
  try {
    const staff = await getActiveStaff(req);
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    const { incidentId } = req.params;
    const { allocatedBed, teamLead, readyDetails } = req.body;

    const payload = {
      hospitalId: staff.hospitalId,
      confirmedBy: staff._id,
      allocatedBed: allocatedBed || "Emergency Bay",
      teamLead: teamLead || staff.name,
      readyDetails: readyDetails || "ER Team on standby",
      readyAt: new Date().toISOString(),
    };

    // 1. Update status in Incident Service
    await notifyIncident(incidentId, "HOSPITAL_READY", payload);

    // 2. Broadcast socket events
    broadcastToIncident(incidentId, "hospital:ready", payload);
    broadcastToHospital(staff.hospitalId, "hospital:ready", { incidentId, ...payload });
    broadcastToAdmin("hospital:ready", { incidentId, ...payload });

    return res.status(200).json({
      success: true,
      message: "Hospital team marked ready for patient arrival",
      data: payload,
    });
  } catch (error) {
    console.error("[markReady] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /me/incoming/:incidentId/unavailable - Divert or decline patient
 */
export const markUnavailable = async (req, res) => {
  try {
    const staff = await getActiveStaff(req);
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    const { incidentId } = req.params;
    const { reason, diversionSuggestion } = req.body;

    const payload = {
      hospitalId: staff.hospitalId,
      reportedBy: staff._id,
      reason: reason || "Bed/Resource unavailable",
      diversionSuggestion: diversionSuggestion || "",
      divertedAt: new Date().toISOString(),
    };

    // 1. Update status in Incident Service
    await notifyIncident(incidentId, "HOSPITAL_UNAVAILABLE", payload);

    // 2. Broadcast socket events
    broadcastToIncident(incidentId, "hospital:unavailable", payload);
    broadcastToHospital(staff.hospitalId, "hospital:unavailable", { incidentId, ...payload });
    broadcastToAdmin("hospital:unavailable", { incidentId, ...payload });

    return res.status(200).json({
      success: true,
      message: "Hospital marked unavailable for incident; diversion requested",
      data: payload,
    });
  } catch (error) {
    console.error("[markUnavailable] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /me/active - Get currently treated / active incident patients
 */
export const getActivePatients = async (req, res) => {
  try {
    const staff = await getActiveStaff(req);
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    try {
      const response = await axios.get(`${env.INCIDENT_SERVICE}/api/incidents`, {
        params: {
          hospitalId: staff.hospitalId.toString(),
          status: "PATIENT_ADMITTED,IN_TREATMENT",
        },
        headers: { "x-internal-secret": env.INTERNAL_SECRET },
        timeout: 5000,
      });

      return res.status(200).json({
        success: true,
        data: response.data.data || response.data || [],
      });
    } catch (err) {
      return res.status(200).json({ success: true, data: [] });
    }
  } catch (error) {
    console.error("[getActivePatients] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /me/history - Get treated / resolved hospital patient history
 */
export const getPatientHistory = async (req, res) => {
  try {
    const staff = await getActiveStaff(req);
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    try {
      const response = await axios.get(`${env.INCIDENT_SERVICE}/api/incidents`, {
        params: {
          hospitalId: staff.hospitalId.toString(),
          status: "DISCHARGED,TRANSFERRED,RESOLVED,CLOSED",
          limit: req.query.limit || 50,
        },
        headers: { "x-internal-secret": env.INTERNAL_SECRET },
        timeout: 5000,
      });

      return res.status(200).json({
        success: true,
        data: response.data.data || response.data || [],
      });
    } catch (err) {
      return res.status(200).json({ success: true, data: [] });
    }
  } catch (error) {
    console.error("[getPatientHistory] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

