import mongoose from "mongoose";
import Ambulance from "../models/ambulance.model.js";
import AmbulanceDriver from "../models/ambulanceDriver.model.js";
import AmbulanceAssignment from "../models/ambulanceAssignment.model.js";
import AmbulanceLocation from "../models/ambulanceLocation.model.js";
import redis from "../config/redis.js";
import { emitToRoom } from "../config/socketClient.js";
import {
  updateStatusSchema,
  updateLocationSchema,
  assignAmbulanceSchema,
  availableQuerySchema,
  updateAmbulanceProfileSchema,
} from "../validators/ambulance.validator.js";
import { saveOtp } from "../services/otp.service.js";

const STATUS_TTL = 10 * 60; // 10 minutes
const LOCATION_TTL = 60; // 60 seconds
const ACTIVE_ASSIGNMENT_TTL = 60 * 60; // 1 hour

/**
 * Helper to find active driver and linked ambulance from userId or userEmail
 */
export async function getDriverAndAmbulance(userId, userEmail) {
  if (!userId && !userEmail) return null;

  const orQueries = [];
  if (userId) {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      orQueries.push({ userId: new mongoose.Types.ObjectId(userId) });
    }
    orQueries.push({ userId: String(userId) });
  }
  if (userEmail) {
    orQueries.push({ email: userEmail.toLowerCase() });
  }

  let driver = await AmbulanceDriver.findOne({
    $or: orQueries,
    status: { $ne: "SUSPENDED" },
  }).sort({ createdAt: 1 });

  if (driver && !driver.userId && userId && mongoose.Types.ObjectId.isValid(userId)) {
    driver.userId = new mongoose.Types.ObjectId(userId);
    await driver.save();
  }

  // If driver was not found, check if this is the demo ambulance driver
  if (!driver && userEmail && userEmail.toLowerCase() === "abc1@gmail.com") {
    try {
      let ambulance = await Ambulance.findOne({ plateNumber: "TS-16-MM-0004" });
      if (!ambulance) {
        ambulance = await Ambulance.create({
          plateNumber: "TS-16-MM-0004",
          type: "basic",
          location: { type: "Point", coordinates: [78.4744, 17.3478] },
          status: "online",
          isApproved: true,
          isActive: true,
          lastLocationAt: new Date(),
        });
      }
      driver = await AmbulanceDriver.findOneAndUpdate(
        { email: "abc1@gmail.com" },
        {
          ambulanceId: ambulance._id,
          email: "abc1@gmail.com",
          userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null,
          name: "abc1",
          status: "ACTIVE",
          activatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      return { driver, ambulance };
    } catch (createErr) {
      console.error("[getDriverAndAmbulance] abc1 provision error:", createErr.message);
    }
  }

  if (!driver) return null;

  const ambulance = await Ambulance.findById(driver.ambulanceId);
  return { driver, ambulance };
}

/* ──────────────────────────────────────────
   DRIVER-FACING CONTROLLERS
   ────────────────────────────────────────── */

export const getMe = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const userEmail = req.headers["x-user-email"];
    const data = await getDriverAndAmbulance(userId, userEmail);

    if (!data || !data.ambulance) {
      return res.status(404).json({
        success: false,
        code: "DRIVER_OR_AMBULANCE_NOT_FOUND",
        message: "No active ambulance assigned to this driver profile",
      });
    }

    const { driver, ambulance } = data;

    // Check for any active assignment
    const activeAssignment = await AmbulanceAssignment.findOne({
      ambulanceId: ambulance._id,
      status: { $in: ["REQUESTED", "ACCEPTED", "EN_ROUTE", "ARRIVED"] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          status: driver.status,
        },
        ambulance: {
          id: ambulance._id,
          plateNumber: ambulance.plateNumber,
          type: ambulance.type,
          status: ambulance.status,
          isApproved: ambulance.isApproved,
          isActive: ambulance.isActive,
          location: ambulance.location,
          hospitalId: ambulance.hospitalId,
          lastLocationAt: ambulance.lastLocationAt,
        },
        activeAssignment: activeAssignment || null,
      },
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const userEmail = req.headers["x-user-email"];
    const data = await getDriverAndAmbulance(userId, userEmail);

    if (!data || !data.ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance driver not found",
      });
    }

    const payload = updateAmbulanceProfileSchema.parse(req.body);
    const { driver, ambulance } = data;

    if (payload.name) driver.name = payload.name;
    if (payload.phone) driver.phone = payload.phone;
    await driver.save();

    if (payload.type) {
      ambulance.type = payload.type;
      await ambulance.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        driver,
        ambulance,
      },
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

export const updateStatus = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const userEmail = req.headers["x-user-email"];
    const data = await getDriverAndAmbulance(userId, userEmail);

    if (!data || !data.ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance not found for this driver",
      });
    }

    const { status } = updateStatusSchema.parse(req.body);
    const { ambulance } = data;

    ambulance.status = status;
    await ambulance.save();

    // Cache in Redis with 10 min TTL
    await redis.set(`ambulance:status:${ambulance._id}`, status, "EX", STATUS_TTL);

    return res.status(200).json({
      success: true,
      data: {
        ambulanceId: ambulance._id,
        status: ambulance.status,
      },
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: error.errors[0]?.message || "Invalid status",
      });
    }
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.userId;
    const userEmail = req.headers["x-user-email"];
    const data = await getDriverAndAmbulance(userId, userEmail);

    if (!data || !data.ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance not found",
      });
    }

    const payload = updateLocationSchema.parse(req.body);
    const { ambulance } = data;

    // 1. Update Ambulance GeoJSON in MongoDB
    ambulance.location = {
      type: "Point",
      coordinates: [payload.longitude, payload.latitude],
    };
    ambulance.lastLocationAt = new Date();
    await ambulance.save();

    // 2. Cache latest live location in Redis (60s TTL)
    const locationData = {
      ambulanceId: ambulance._id,
      lat: payload.latitude,
      lng: payload.longitude,
      accuracy: payload.accuracy || null,
      heading: payload.heading || null,
      speed: payload.speed || null,
      ts: Date.now(),
    };
    await redis.set(
      `ambulance:location:${ambulance._id}`,
      JSON.stringify(locationData),
      "EX",
      LOCATION_TTL
    );

    // 3. Throttled historical location logging (max once every 10 seconds per ambulance)
    const throttleKey = `ambulance:loc_throttle:${ambulance._id}`;
    const isThrottled = await redis.get(throttleKey);

    if (!isThrottled) {
      await redis.set(throttleKey, "1", "EX", 10);
      await AmbulanceLocation.create({
        ambulanceId: ambulance._id,
        incidentId: payload.incidentId ? new mongoose.Types.ObjectId(payload.incidentId) : null,
        location: {
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracy: payload.accuracy,
          heading: payload.heading,
          speed: payload.speed,
        },
        recordedAt: new Date(),
      }).catch((e) => console.warn("Failed to write historical location:", e.message));
    }

    // 4. Socket broadcast to incident, hospital, and admin:operations
    let incidentId = payload.incidentId;
    if (!incidentId) {
      // Check if there is an active assignment cached
      const cachedAssignment = await redis.get(`ambulance:active:${ambulance._id}`);
      if (cachedAssignment) {
        const assignment = await AmbulanceAssignment.findById(cachedAssignment);
        if (assignment) incidentId = assignment.incidentId;
      }
    }

    if (incidentId) {
      emitToRoom(`incident:${incidentId}`, "ambulance:location_update", locationData);
    }
    if (ambulance.hospitalId) {
      emitToRoom(`hospital:${ambulance.hospitalId}`, "ambulance:location_update", locationData);
    }
    emitToRoom("admin:operations", "ambulance:location_update", locationData);

    return res.status(200).json({
      success: true,
      data: locationData,
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
   INTERNAL CONTROLLERS (X-Internal-Secret)
   ────────────────────────────────────────── */

const haversineDistanceKm = (lon1, lat1, lon2, lat2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const getAvailableAmbulances = async (req, res) => {
  try {
    let lat = parseFloat(req.query.lat);
    let lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 50000;

    if (isNaN(lat) || isNaN(lng)) {
      lat = 17.3850;
      lng = 78.4867;
    }

    let ambulances = [];
    try {
      ambulances = await Ambulance.find({
        status: "online",
        isApproved: true,
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radius,
          },
        },
      }).lean().limit(25);
    } catch (geoErr) {
      console.warn("Geospatial query failed, falling back to online search:", geoErr.message);
    }

    // Fallback 1: if no ambulances found near the point, return all online ambulances
    // Fallback: if no ambulances found near the specific radius, return online approved ambulances
    if (!ambulances || ambulances.length === 0) {
      ambulances = await Ambulance.find({
        status: "online",
        isApproved: true,
        isActive: true,
      }).lean().limit(25);
    }

    // Fallback 2: return any approved ambulances
    if (!ambulances || ambulances.length === 0) {
      ambulances = await Ambulance.find({
        isApproved: true,
      }).lean().limit(25);
    }
    // STRICT FILTER: Like Uber, only return units that are genuinely online and active
    ambulances = (ambulances || []).filter(
      (amb) => amb.status === "online" && amb.isActive === true && amb.isApproved === true
    );

    const results = (ambulances || []).map((amb) => {
      const ambLng = amb.location?.coordinates?.[0] ?? 78.4482;
      const ambLat = amb.location?.coordinates?.[1] ?? 17.4156;
      const distanceKm = haversineDistanceKm(lng, lat, ambLng, ambLat);
      return {
        ...amb,
        distanceKm,
      };
    });

    results.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const getDriverByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").trim().toLowerCase();
    const driver = await AmbulanceDriver.findOne({ email }).populate("ambulanceId");

    if (!driver) {
      return res.status(404).json({
        success: false,
        code: "DRIVER_NOT_FOUND",
        message: "Driver not found with this email",
      });
    }

    return res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const activateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const driver = await AmbulanceDriver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        code: "DRIVER_NOT_FOUND",
        message: "Driver not found",
      });
    }

    driver.status = "ACTIVE";
    driver.activatedAt = new Date();
    if (userId) {
      driver.userId = new mongoose.Types.ObjectId(userId);
    }
    await driver.save();

    return res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const assignAmbulance = async (req, res) => {
  try {
    const { id: ambulanceId } = req.params;
    const payload = assignAmbulanceSchema.parse(req.body);

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        code: "AMBULANCE_NOT_FOUND",
        message: "Ambulance not found",
      });
    }

    // Find driver of this ambulance
    const driver = await AmbulanceDriver.findOne({
      ambulanceId: ambulance._id,
      status: "ACTIVE",
    });

    // Create Assignment
    const assignment = new AmbulanceAssignment({
      incidentId: new mongoose.Types.ObjectId(payload.incidentId),
      ambulanceId: ambulance._id,
      driverId: driver ? driver._id : null,
      userId: payload.userId ? new mongoose.Types.ObjectId(payload.userId) : null,
      hospitalId: payload.hospitalId ? new mongoose.Types.ObjectId(payload.hospitalId) : ambulance.hospitalId,
      status: "REQUESTED",
      requestedAt: new Date(),
    });

    if (payload.arrivalOtp) {
      const { hash, expiresAt } = await saveOtp(assignment._id, payload.arrivalOtp);
      assignment.arrivalOtpHash = hash;
      assignment.arrivalOtpExpiresAt = expiresAt;
    }

    await assignment.save();

    // Cache active assignment in Redis
    await redis.set(
      `ambulance:active:${ambulance._id}`,
      String(assignment._id),
      "EX",
      ACTIVE_ASSIGNMENT_TTL
    );

    // Emit ambulance:requested -> ambulance:{ambulanceId} and driver role rooms
    const emitPayload = {
      assignmentId: assignment._id,
      incidentId: payload.incidentId,
      ambulanceId: ambulance._id,
      priority: payload.priority,
    };
    emitToRoom(`ambulance:${ambulance._id}`, "ambulance:requested", emitPayload);
    emitToRoom("ambulances", "ambulance:requested", emitPayload);
    emitToRoom("role:ambulance", "ambulance:requested", emitPayload);

    return res.status(201).json({
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

export const getAmbulanceInternal = async (req, res) => {
  try {
    const { id } = req.params;
    const ambulance = await Ambulance.findById(id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance not found",
      });
    }

    const driver = await AmbulanceDriver.findOne({
      ambulanceId: ambulance._id,
      status: "ACTIVE",
    });

    const cachedStatus = await redis.get(`ambulance:status:${id}`);
    const cachedLocation = await redis.get(`ambulance:location:${id}`);

    return res.status(200).json({
      success: true,
      data: {
        ...ambulance.toObject(),
        liveStatus: cachedStatus || ambulance.status,
        liveLocation: cachedLocation ? JSON.parse(cachedLocation) : null,
        driver,
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
   ADMIN CONTROLLERS (Minimal)
   ────────────────────────────────────────── */

export const listAmbulances = async (req, res) => {
  try {
    const { status, isApproved, hospitalId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (isApproved !== undefined) filter.isApproved = isApproved === "true";
    if (hospitalId) filter.hospitalId = hospitalId;

    const list = await Ambulance.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const getAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: ambulance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const approveAmbulance = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance not found",
      });
    }

    ambulance.isApproved = true;
    ambulance.approvedAt = new Date();
    if (userId) ambulance.approvedBy = new mongoose.Types.ObjectId(userId);
    await ambulance.save();

    return res.status(200).json({
      success: true,
      data: ambulance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

export const suspendAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Ambulance not found",
      });
    }

    ambulance.isActive = false;
    ambulance.status = "offline";
    await ambulance.save();

    await redis.set(`ambulance:status:${ambulance._id}`, "offline", "EX", STATUS_TTL);

    return res.status(200).json({
      success: true,
      data: ambulance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/**
 * POST /internal - Internal endpoint to create or register ambulance + primary driver
 */
export const createAmbulanceInternal = async (req, res) => {
  try {
    const { ambulance: ambData, driver: driverData } = req.body;

    if (!ambData?.plateNumber) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Plate number is required",
      });
    }

    const plateNumber = ambData.plateNumber.trim().toUpperCase();

    let ambulance = await Ambulance.findOne({ plateNumber });
    if (!ambulance) {
      ambulance = await Ambulance.create({
        plateNumber,
        type: ambData.type || "basic",
        hospitalId: ambData.hospitalId || null,
        location: ambData.location || { type: "Point", coordinates: [78.445, 17.41] },
        status: "online",
        isApproved: true,
        isActive: true,
        lastLocationAt: new Date(),
      });
    } else {
      ambulance.status = "online";
      ambulance.isApproved = true;
      ambulance.isActive = true;
      await ambulance.save();
    }

    let driver = null;
    if (driverData && driverData.email) {
      const email = driverData.email.trim().toLowerCase();
      driver = await AmbulanceDriver.findOne({ email });
      if (!driver) {
        driver = await AmbulanceDriver.create({
          ambulanceId: ambulance._id,
          email,
          userId: driverData.userId || null,
          name: driverData.name || "",
          phone: driverData.phone || "",
          status: "ACTIVE",
          activatedAt: new Date(),
        });
      } else {
        driver.ambulanceId = ambulance._id;
        if (driverData.userId) driver.userId = driverData.userId;
        if (driverData.name) driver.name = driverData.name;
        if (driverData.phone) driver.phone = driverData.phone;
        driver.status = "ACTIVE";
        await driver.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Ambulance and driver created successfully",
      data: {
        ambulance,
        driver,
      },
    });
  } catch (error) {
    console.error("[createAmbulanceInternal] Error:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

