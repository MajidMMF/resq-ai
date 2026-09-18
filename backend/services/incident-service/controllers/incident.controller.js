import mongoose from "mongoose";
import Incident from "../models/incident.model.js";
import IncidentEvent from "../models/incidentEvent.model.js";
import { createIncidentSchema, cancelIncidentSchema, updateStatusSchema, validateImageKey } from "../validators/incident.validator.js";
import { getPresignedUrl } from "../services/s3.service.js";
import { getStateTransitionError, INCIDENT_STATES } from "../services/stateMachine.js";
import { redis } from "../../../shared/redis/redis.js";
import { broadcastNewIncident, broadcastHospitalSelection, broadcastIncidentStatusUpdate } from "../services/broadcast.service.js";

const getUserId = (req) => {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  if (!userId) {
    throw new Error("MISSING_USER");
  }
  return userId;
};

const createEvent = async (incidentId, event, actorId = null, metadata = {}) => {
  await IncidentEvent.create({
    incidentId,
    event,
    actorId,
    metadata,
  });
};

const cacheIncident = async (incident) => {
  const payload = JSON.stringify(incident.toObject ? incident.toObject() : incident);
  await redis.set(`incident:active:${incident._id.toString()}`, payload, "EX", 3600);
};

const serializeIncident = async (incident) => {
  const plain = incident.toObject ? incident.toObject() : incident;

  if (plain.imageKey) {
    plain.imageUrl = await getPresignedUrl(plain.imageKey);
  }

  return plain;
};

export const createIncident = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = createIncidentSchema.parse(req.body);

    if (payload.imageKey && !validateImageKey(payload.imageKey)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IMAGE_KEY",
        message: "Invalid imageKey format",
      });
    }

    const incident = await Incident.create({
      reporterId: new mongoose.Types.ObjectId(userId),
      description: payload.description || null,
      imageKey: payload.imageKey || null,
      location: payload.location,
      status: INCIDENT_STATES.CREATED,
    });

    await createEvent(
      incident._id,
      "CREATED",
      userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null,
      { location: payload.location, imageKey: payload.imageKey || null }
    );

    await cacheIncident(incident);

    broadcastNewIncident(incident).catch((bErr) => {
      console.warn("⚠️ Incident broadcast warning:", bErr.message);
    });

    return res.status(201).json({
      success: true,
      data: await serializeIncident(incident),
    });
  } catch (error) {
    console.error("[INCIDENT] createIncident error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        errors: error.errors,
      });
    }

    if (error.message === "MISSING_USER") {
      return res.status(401).json({
        success: false,
        code: "MISSING_USER",
        message: "X-User-Id header is required",
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  }
};

export const listMyIncidents = async (req, res) => {
  try {
    const internalSecret = req.headers["x-internal-secret"];
    const isInternal =
      internalSecret &&
      internalSecret === (process.env.INTERNAL_SECRET || "change-this-to-random-string");
    const userId = req.headers["x-user-id"] || req.query.userId;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.live === "true" || req.query.scope === "all") {
      // Live city-wide radar query for active incidents
      if (req.query.status === "ACTIVE" || !req.query.status) {
        filter.status = { $nin: ["RESOLVED", "CANCELLED", "REJECTED"] };
      } else if (req.query.status !== "ALL") {
        const statuses = req.query.status.split(",").map((s) => s.trim());
        filter.status = { $in: statuses };
      }
    } else if (req.query.hospitalId) {
      const hospId = req.query.hospitalId;
      const orConditions = [];
      if (mongoose.Types.ObjectId.isValid(hospId)) {
        orConditions.push({ hospitalId: new mongoose.Types.ObjectId(hospId) });
        orConditions.push({ selectedHospitalId: new mongoose.Types.ObjectId(hospId) });
      }
      orConditions.push({ hospitalId: String(hospId) });
      orConditions.push({ selectedHospitalId: String(hospId) });
      filter.$or = orConditions;

      if (req.query.status) {
        const statuses = req.query.status.split(",").map((s) => s.trim());
        if (statuses.includes("HOSPITAL_ASSIGNED")) {
          statuses.push("HOSPITAL_SELECTED");
        }
        filter.status = { $in: statuses };
      }
    } else if (req.query.ambulanceId) {
      const ambId = req.query.ambulanceId;
      const orConditions = [];
      if (mongoose.Types.ObjectId.isValid(ambId)) {
        orConditions.push({ ambulanceId: new mongoose.Types.ObjectId(ambId) });
        orConditions.push({ assignedAmbulanceId: new mongoose.Types.ObjectId(ambId) });
      }
      orConditions.push({ ambulanceId: String(ambId) });
      orConditions.push({ assignedAmbulanceId: String(ambId) });
      filter.$or = orConditions;

      if (req.query.status) {
        const statuses = req.query.status.split(",").map((s) => s.trim());
        filter.status = { $in: statuses };
      }
    } else {
      if (!userId && !isInternal) {
        return res.status(401).json({
          success: false,
          code: "MISSING_USER",
          message: "X-User-Id header is required",
        });
      }

      if (userId) {
        const orUser = [];
        if (mongoose.Types.ObjectId.isValid(userId)) {
          orUser.push({ reporterId: new mongoose.Types.ObjectId(userId) });
        }
        orUser.push({ reporterId: String(userId) });
        filter.$or = orUser;
      }
      if (req.query.status) {
        if (req.query.status === "ACTIVE") {
          filter.status = { $nin: ["RESOLVED", "CANCELLED", "REJECTED"] };
        } else if (req.query.status === "RESOLVED") {
          filter.status = "RESOLVED";
        } else if (req.query.status === "CANCELLED") {
          filter.status = { $in: ["CANCELLED", "REJECTED"] };
        } else if (req.query.status !== "ALL") {
          const statuses = req.query.status.split(",").map((s) => s.trim());
          filter.status = { $in: statuses };
        }
      }
    }

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Incident.countDocuments(filter),
    ]);

    const items = await Promise.all(
      incidents.map(async (incident) => {
        const item = { ...incident };
        if (item.imageKey) {
          item.imageUrl = await getPresignedUrl(item.imageKey);
        }
        return item;
      })
    );

    return res.status(200).json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error("listMyIncidents error:", error);

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  }
};

export const getIncident = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRoles = (req.headers["x-user-roles"] || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "MISSING_USER",
        message: "X-User-Id header is required",
      });
    }

    const incident = await Incident.findById(req.params.id).lean();

    if (!incident) {
      return res.status(404).json({
        success: false,
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
    }

    const isReporter = incident.reporterId.toString() === userId;
    const isAdmin = userRoles.includes("ADMIN");
    const isDriver = userRoles.includes("AMBULANCE_DRIVER");
    const isHospitalStaff = userRoles.includes("HOSPITAL_STAFF");

    if (!isReporter && !isAdmin && !isDriver && !isHospitalStaff) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Not allowed to view this incident",
      });
    }

    const events = await IncidentEvent.find({ incidentId: incident._id }).sort({ createdAt: 1 }).lean();

    const response = { ...incident };

    if (response.imageKey) {
      response.imageUrl = await getPresignedUrl(response.imageKey);
    }

    return res.status(200).json({
      success: true,
      data: {
        incident: response,
        events,
      },
    });
  } catch (error) {
    console.error("getIncident error:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRoles = (req.headers["x-user-roles"] || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "MISSING_USER",
        message: "X-User-Id header is required",
      });
    }

    const incident = await Incident.findById(req.params.id).lean();

    if (!incident) {
      return res.status(404).json({
        success: false,
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
    }

    const isReporter = incident.reporterId.toString() === userId;
    const isAdmin = userRoles.includes("ADMIN");
    const isDriver = userRoles.includes("AMBULANCE_DRIVER");
    const isHospitalStaff = userRoles.includes("HOSPITAL_STAFF");

    if (!isReporter && !isAdmin && !isDriver && !isHospitalStaff) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Not allowed to view this incident",
      });
    }

    const events = await IncidentEvent.find({ incidentId: incident._id }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: { incidentId: incident._id, events },
    });
  } catch (error) {
    console.error("getTimeline error:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  }
};

export const cancelIncident = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = cancelIncidentSchema.parse(req.body);

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
    }

    if (incident.reporterId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only reporter can cancel this incident",
      });
    }

    const cancellableStatuses = [
      INCIDENT_STATES.CREATED,
      INCIDENT_STATES.ANALYZING,
      INCIDENT_STATES.READY,
      INCIDENT_STATES.HOSPITAL_SELECTED,
      INCIDENT_STATES.AMBULANCE_REQUESTED,
    ];

    if (!cancellableStatuses.includes(incident.status)) {
      return res.status(409).json({
        success: false,
        code: "INVALID_TRANSITION",
        message: "Incident cannot be cancelled in its current state",
      });
    }

    incident.status = INCIDENT_STATES.CANCELLED;
    await incident.save();

    await createEvent(incident._id, "INCIDENT_CANCELLED", new mongoose.Types.ObjectId(userId), {
      reason: payload.reason || null,
    });

    await cacheIncident(incident);

    return res.status(200).json({
      success: true,
      data: await serializeIncident(incident),
    });
  } catch (error) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: error.errors?.[0]?.message || "Invalid payload",
        errors: error.errors || [],
      });
    }

    console.error("cancelIncident error:", error?.message || error);

    if (error?.message === "MISSING_USER") {
      return res.status(401).json({
        success: false,
        code: "MISSING_USER",
        message: "X-User-Id header is required",
      });
    }

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  }
};

export const selectHospital = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;
    const { hospitalId, hospitalData } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
    }

    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      incident.hospitalId = new mongoose.Types.ObjectId(hospitalId);
      incident.selectedHospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    incident.status = INCIDENT_STATES.HOSPITAL_SELECTED;
    await incident.save();

    await createEvent(
      incident._id,
      "HOSPITAL_SELECTED",
      userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null,
      { hospitalId, hospitalData: hospitalData || null }
    );

    await cacheIncident(incident);

    // Notify the selected hospital immediately via targeted broadcast
    broadcastHospitalSelection(incident, hospitalId, hospitalData).catch((bErr) => {
      console.warn("⚠️ Hospital selection broadcast warning:", bErr.message);
    });

    return res.status(200).json({
      success: true,
      data: await serializeIncident(incident),
    });
  } catch (error) {
    console.error("selectHospital error:", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message || "Failed to select hospital",
    });
  }
};

export const requestAmbulance = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;
    const { ambulanceId, hospitalId, ambulanceData } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
    }

    if (ambulanceId && mongoose.Types.ObjectId.isValid(ambulanceId)) {
      incident.ambulanceId = new mongoose.Types.ObjectId(ambulanceId);
      incident.assignedAmbulanceId = new mongoose.Types.ObjectId(ambulanceId);
    }
    if (ambulanceData) {
      incident.assignedAmbulanceDetails = ambulanceData;
    }
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      incident.hospitalId = new mongoose.Types.ObjectId(hospitalId);
      incident.selectedHospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    // Arrival OTP is generated and revealed only after the ambulance driver ACCEPTS the callout
    incident.status = INCIDENT_STATES.AMBULANCE_REQUESTED;
    await incident.save();

    await createEvent(
      incident._id,
      "AMBULANCE_REQUESTED",
      userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null,
      { ambulanceId, hospitalId }
    );

    await cacheIncident(incident);

    // Forward assignment call to ambulance-service
    if (ambulanceId) {
      try {
        const ambServiceUrl = process.env.AMBULANCE_SERVICE || "http://localhost:8007";
        const secret = process.env.INTERNAL_SECRET || "change-this-to-random-string";

        const ambAssignRes = await fetch(`${ambServiceUrl}/${ambulanceId}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": secret,
          },
          body: JSON.stringify({
            incidentId: incident._id.toString(),
            userId: userId || null,
            hospitalId: incident.hospitalId ? incident.hospitalId.toString() : null,
            priority: incident.priority || "HIGH",
          }),
        });

        if (!ambAssignRes.ok) {
          console.warn("Failed to notify ambulance-service of assignment:", await ambAssignRes.text());
        }
      } catch (ambErr) {
        console.error("Error communicating with ambulance-service during assignment:", ambErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: await serializeIncident(incident),
    });
  } catch (error) {
    console.error("requestAmbulance error:", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message || "Failed to request ambulance",
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, metadata = {} } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_STATUS",
        message: "status is required",
      });
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
    }

    // Validate transition using state machine
    const transitionError = getStateTransitionError(incident.status, status);
    if (transitionError) {
      return res.status(transitionError.statusCode).json({
        success: false,
        code: transitionError.code,
        message: transitionError.message,
      });
    }

    // Update status
    incident.status = status;

    // Additional metadata updates
    if (status === INCIDENT_STATES.RESOLVED) {
      incident.resolvedAt = new Date();
    }
    if (metadata.arrivalOtp) {
      incident.arrivalOtp = metadata.arrivalOtp;
    } else if (
      (status === INCIDENT_STATES.AMBULANCE_ACCEPTED || status === INCIDENT_STATES.EN_ROUTE) &&
      !incident.arrivalOtp
    ) {
      incident.arrivalOtp = String(Math.floor(1000 + Math.random() * 9000));
      incident.otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    }
    if (metadata.otpExpiresAt) {
      incident.otpExpiresAt = new Date(metadata.otpExpiresAt);
    }
    if (metadata.ambulanceId) {
      incident.assignedAmbulanceId = metadata.ambulanceId;
      incident.ambulanceId = metadata.ambulanceId;
    }
    if (metadata.assignedAmbulanceDetails) {
      incident.assignedAmbulanceDetails = metadata.assignedAmbulanceDetails;
    }
    if (metadata.hospitalId) {
      incident.selectedHospitalId = metadata.hospitalId;
      incident.hospitalId = metadata.hospitalId;
    }

    await incident.save();

    // Create IncidentEvent
    const actorId = req.headers["x-user-id"] || null;
    await createEvent(
      incident._id,
      `STATUS_UPDATED_${status}`,
      actorId && mongoose.Types.ObjectId.isValid(actorId) ? new mongoose.Types.ObjectId(actorId) : null,
      { newStatus: status, metadata }
    );

    await cacheIncident(incident);

    broadcastIncidentStatusUpdate(incident, status, metadata).catch((bErr) => {
      console.warn("⚠️ Incident status update broadcast warning:", bErr.message);
    });

    return res.status(200).json({
      success: true,
      data: await serializeIncident(incident),
    });
  } catch (error) {
    console.error("updateStatus error:", error?.message || error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message || "Failed to update status",
    });
  }
};
