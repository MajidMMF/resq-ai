import Emergency from "../models/emergency.model.js";
import { EMERGENCY_STATES } from "../../../shared/constants/emergencyStates.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { sendError, sendSuccess } from "../../../shared/http/responses.js";
import { canTransitionEmergency, getAllowedTransitions } from "../utils/stateMachine.js";

const isPoint = (value) => {
  return (
    value &&
    Number.isFinite(Number(value.lat)) &&
    Number.isFinite(Number(value.lng)) &&
    Number(value.lat) >= -90 &&
    Number(value.lat) <= 90 &&
    Number(value.lng) >= -180 &&
    Number(value.lng) <= 180
  );
};

const assertEmergencyOwner = (emergency, auth) => {
  return auth.role === ROLES.ADMIN || String(emergency.userId) === String(auth.userId);
};

export const createEmergency = async (req, res) => {
  try {
    const { pickupLocation, patientImage, aiAnalysis } = req.body;

    if (!isPoint(pickupLocation)) {
      return sendError(res, 422, "Pickup location is required");
    }

    const emergency = await Emergency.create({
      userId: req.auth.userId,
      pickupLocation,
      patientImage,
      aiAnalysis,
      stateHistory: [
        {
          to: EMERGENCY_STATES.USER_REQUESTED,
          actorRole: req.auth.role,
          actorId: req.auth.userId,
          reason: "Emergency session created",
        },
      ],
    });

    return sendSuccess(res, 201, "Emergency session created", { emergency });
  } catch (error) {
    console.error("Create emergency error:", error);
    return sendError(res, 500, "Unable to create emergency session", error.message);
  }
};

export const getEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return sendError(res, 404, "Emergency session not found");
    }

    if (!assertEmergencyOwner(emergency, req.auth)) {
      return sendError(res, 403, "You are not allowed to view this emergency session");
    }

    return sendSuccess(res, 200, "Emergency session", {
      emergency,
      allowedTransitions: getAllowedTransitions(emergency.state, req.auth.role),
    });
  } catch (error) {
    console.error("Get emergency error:", error);
    return sendError(res, 500, "Unable to load emergency session", error.message);
  }
};

export const selectHospital = async (req, res) => {
  try {
    const { hospitalId, placeId, name, location } = req.body;

    if (!name || !isPoint(location) || (!hospitalId && !placeId)) {
      return sendError(res, 422, "A verified hospital snapshot is required");
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return sendError(res, 404, "Emergency session not found");
    }

    if (!assertEmergencyOwner(emergency, req.auth)) {
      return sendError(res, 403, "You are not allowed to update this emergency session");
    }

    if (!canTransitionEmergency(emergency.state, EMERGENCY_STATES.HOSPITAL_SELECTED, req.auth.role)) {
      return sendError(res, 409, `Cannot select a hospital while emergency is ${emergency.state}`);
    }

    emergency.selectedHospital = {
      hospitalId,
      placeId,
      name,
      location,
      selectedAt: new Date(),
    };
    emergency.stateHistory.push({
      from: emergency.state,
      to: EMERGENCY_STATES.HOSPITAL_SELECTED,
      actorRole: req.auth.role,
      actorId: req.auth.userId,
      reason: "Hospital selected",
    });
    emergency.state = EMERGENCY_STATES.HOSPITAL_SELECTED;

    await emergency.save();

    return sendSuccess(res, 200, "Hospital selected", { emergency });
  } catch (error) {
    console.error("Select hospital error:", error);
    return sendError(res, 500, "Unable to select hospital", error.message);
  }
};

export const assignAmbulance = async (req, res) => {
  try {
    const { ambulanceId, displayName } = req.body;

    if (!ambulanceId) {
      return sendError(res, 422, "A verified ambulance id is required");
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return sendError(res, 404, "Emergency session not found");
    }

    if (!assertEmergencyOwner(emergency, req.auth)) {
      return sendError(res, 403, "You are not allowed to update this emergency session");
    }

    if (!canTransitionEmergency(emergency.state, EMERGENCY_STATES.AMBULANCE_ASSIGNED, req.auth.role)) {
      return sendError(res, 409, `Cannot assign an ambulance while emergency is ${emergency.state}`);
    }

    emergency.assignedAmbulance = {
      ambulanceId,
      displayName,
      assignedAt: new Date(),
    };
    emergency.stateHistory.push({
      from: emergency.state,
      to: EMERGENCY_STATES.AMBULANCE_ASSIGNED,
      actorRole: req.auth.role,
      actorId: req.auth.userId,
      reason: "Ambulance assigned",
    });
    emergency.state = EMERGENCY_STATES.AMBULANCE_ASSIGNED;

    await emergency.save();

    return sendSuccess(res, 200, "Ambulance assigned", { emergency });
  } catch (error) {
    console.error("Assign ambulance error:", error);
    return sendError(res, 500, "Unable to assign ambulance", error.message);
  }
};

export const transitionEmergency = async (req, res) => {
  try {
    const { state, reason } = req.body;

    if (!Object.values(EMERGENCY_STATES).includes(state)) {
      return sendError(res, 422, "Invalid emergency state");
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return sendError(res, 404, "Emergency session not found");
    }

    if (!canTransitionEmergency(emergency.state, state, req.auth.role)) {
      return sendError(res, 409, `Cannot transition from ${emergency.state} to ${state}`);
    }

    emergency.stateHistory.push({
      from: emergency.state,
      to: state,
      actorRole: req.auth.role,
      actorId: req.auth.userId,
      reason,
    });
    emergency.state = state;

    if (state === EMERGENCY_STATES.AMBULANCE_ACCEPTED) {
      emergency.assignedAmbulance.acceptedAt = new Date();
    }

    if (state === EMERGENCY_STATES.OTP_VERIFIED) {
      emergency.otpVerification = {
        verified: true,
        verifiedAt: new Date(),
      };
    }

    if (state === EMERGENCY_STATES.EMERGENCY_COMPLETED) {
      emergency.completedAt = new Date();
    }

    if (state === EMERGENCY_STATES.CANCELLED) {
      emergency.cancelledAt = new Date();
    }

    await emergency.save();

    return sendSuccess(res, 200, "Emergency state updated", {
      emergency,
      allowedTransitions: getAllowedTransitions(emergency.state, req.auth.role),
    });
  } catch (error) {
    console.error("Transition emergency error:", error);
    return sendError(res, 500, "Unable to update emergency state", error.message);
  }
};
