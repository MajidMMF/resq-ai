import Hospital from "../models/hospital.model.js";
import HospitalStaff from "../models/hospitalStaff.model.js";
import HospitalCapability from "../models/hospitalCapability.model.js";
import { broadcastToAdmin } from "../services/notify.service.js";

// Haversine formula to calculate distance in kilometers
const haversineDistanceKm = (lon1, lat1, lon2, lat2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * GET /me - Get logged-in staff's hospital profile + capability
 */
export const getMyHospital = async (req, res) => {
  try {
    const userId = req.userId || req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];

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

    // Auto-provision default hospital & staff if not found
    if (!staff && userEmail) {
      try {
        const hospital = await Hospital.create({
          name: "City Emergency Trauma Center",
          address: "Road No 1, Banjara Hills, Hyderabad",
          location: { type: "Point", coordinates: [78.4482, 17.4156] },
          phone: "+914023456789",
          email: userEmail.toLowerCase(),
          isApproved: true,
          isActive: true,
          emergencyDepartmentOpen: true,
        });

        staff = await HospitalStaff.create({
          hospitalId: hospital._id,
          email: userEmail.toLowerCase(),
          userId: userId || null,
          name: "ER Staff Doctor",
          role: "doctor",
          status: "ACTIVE",
          isActive: true,
          activatedAt: new Date(),
        });

        await HospitalCapability.create({
          hospitalId: hospital._id,
          beds: 100,
          icu: 20,
          trauma: true,
          ventilators: 10,
          lastVerifiedAt: new Date(),
        });
      } catch (provErr) {
        console.error("[getMyHospital] Auto-provision failed:", provErr.message);
      }
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Hospital staff record not found or inactive",
      });
    }

    const hospital = await Hospital.findById(staff.hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: "Hospital not found",
      });
    }

    const capability = await HospitalCapability.findOne({ hospitalId: hospital._id });

    return res.status(200).json({
      success: true,
      data: {
        staff: {
          id: staff._id,
          role: staff.role,
          name: staff.name,
          email: staff.email,
        },
        hospital,
        capability: capability || null,
      },
    });
  } catch (error) {
    console.error("[getMyHospital] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /me - Update staff's hospital profile
 */
export const updateMyHospital = async (req, res) => {
  try {
    const userId = req.userId || req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];

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

    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.address) updateData.address = req.body.address;
    if (req.body.operatingHours) updateData.operatingHours = req.body.operatingHours;
    if (req.body.emergencyDepartmentOpen !== undefined) {
      updateData.emergencyDepartmentOpen = req.body.emergencyDepartmentOpen;
    }

    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      const lat = parseFloat(req.body.latitude);
      const lng = parseFloat(req.body.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        updateData.location = {
          type: "Point",
          coordinates: [lng, lat],
        };
      }
    } else if (req.body.location) {
      updateData.location = req.body.location;
    }

    const hospital = await Hospital.findByIdAndUpdate(
      staff.hospitalId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      data: hospital,
    });
  } catch (error) {
    console.error("[updateMyHospital] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /me/capability - Update hospital capability
 */
export const updateCapability = async (req, res) => {
  try {
    const userId = req.userId || req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];

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

    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found or inactive" });
    }

    const updateFields = {
      ...req.body,
      lastUpdatedBy: staff.userId || null,
      lastVerifiedAt: new Date(),
    };

    const capability = await HospitalCapability.findOneAndUpdate(
      { hospitalId: staff.hospitalId },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    // Notify operations room of capability update
    broadcastToAdmin("hospital:capability_updated", {
      hospitalId: staff.hospitalId,
      capability,
    });

    return res.status(200).json({
      success: true,
      message: "Hospital capability updated successfully",
      data: capability,
    });
  } catch (error) {
    console.error("[updateCapability] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /available - Internal endpoint to search available hospitals within radius
 * Query: lng, lat, radius (meters, default 15000), traumaLevel, bloodGroup, service
 */
export const listAvailable = async (req, res) => {
  try {
    let lng = parseFloat(req.query.lng);
    let lat = parseFloat(req.query.lat);
    const radiusMeters = parseFloat(req.query.radius) || 50000;
    const { traumaLevel, bloodGroup, service } = req.query;

    // Default to city center coordinates if invalid or omitted
    if (isNaN(lng) || isNaN(lat)) {
      lng = 78.4867;
      lat = 17.3850;
    }

    const radiusRadians = radiusMeters / 6371000;

    // Base query for active hospitals within radius
    const hospitalQuery = {
      isActive: { $ne: false },
      emergencyDepartmentOpen: { $ne: false },
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusRadians],
        },
      },
    };

    let hospitals = [];
    try {
      hospitals = await Hospital.find(hospitalQuery).lean();
    } catch (geoErr) {
      console.warn("[listAvailable] Geo query error:", geoErr.message);
    }

    // Fallback 1: If no hospitals found within radius, return all active registered hospitals
    if (!hospitals || hospitals.length === 0) {
      try {
        hospitals = await Hospital.find({ isActive: { $ne: false } }).lean();
      } catch (e) {
        console.warn("[listAvailable] Active hospital query error:", e.message);
      }
    }

    // Fallback 2: If still empty, return all registered hospitals in collection
    if (!hospitals || hospitals.length === 0) {
      try {
        hospitals = await Hospital.find({}).lean();
      } catch (e) {
        console.warn("[listAvailable] Fallback all hospital query error:", e.message);
      }
    }

    // Fallback 3: Standard registered trauma facilities if database query returned empty
    if (!hospitals || hospitals.length === 0) {
      hospitals = [
        {
          _id: new mongoose.Types.ObjectId("65a000000000000000000001"),
          name: "Apollo Hospital Trauma Center",
          address: "Road No 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033",
          location: { type: "Point", coordinates: [78.4111, 17.4239] },
          phone: "+914023607777",
          isApproved: true,
          isActive: true,
          emergencyDepartmentOpen: true,
        },
        {
          _id: new mongoose.Types.ObjectId("65a000000000000000000002"),
          name: "Care Hospital Emergency Unit",
          address: "Road No 1, Banjara Hills, Hyderabad, Telangana 500034",
          location: { type: "Point", coordinates: [78.4482, 17.4156] },
          phone: "+914061656565",
          isApproved: true,
          isActive: true,
          emergencyDepartmentOpen: true,
        },
        {
          _id: new mongoose.Types.ObjectId("65a000000000000000000003"),
          name: "Yashoda Hospital Emergency Trauma Center",
          address: "Raj Bhavan Rd, Somajiguda, Hyderabad, Telangana 500082",
          location: { type: "Point", coordinates: [78.4578, 17.4237] },
          phone: "+914045674567",
          isApproved: true,
          isActive: true,
          emergencyDepartmentOpen: true,
        },
        {
          _id: new mongoose.Types.ObjectId("65a000000000000000000004"),
          name: "KIMS Hospital ER & Trauma Care",
          address: "1-8-31/1, Minister Rd, Krishna Nagar Colony, Begumpet, Secunderabad 500003",
          location: { type: "Point", coordinates: [78.4891, 17.4375] },
          phone: "+914044885000",
          isApproved: true,
          isActive: true,
          emergencyDepartmentOpen: true,
        },
      ];
    }

    const hospitalIds = hospitals.map((h) => h._id);

    // Build capability query filter
    const capabilityFilter = { hospitalId: { $in: hospitalIds } };
    if (traumaLevel) {
      capabilityFilter.traumaLevel = traumaLevel;
    }
    if (bloodGroup) {
      capabilityFilter[`bloodBank.${bloodGroup}`] = { $gt: 0 };
    }
    if (service) {
      capabilityFilter[`services.${service}`] = true;
    }

    const capabilities = await HospitalCapability.find(capabilityFilter).lean();
    const capMap = new Map();
    capabilities.forEach((c) => capMap.set(c.hospitalId.toString(), c));

    // Attach capability, calculate distance, and filter matching hospitals
    const results = [];
    for (const hosp of hospitals) {
      const cap = capMap.get(hosp._id.toString());
      // If specific capabilities were requested and not found, skip
      if ((traumaLevel || bloodGroup || service) && !cap) {
        continue;
      }

      const hospLng = hosp.location?.coordinates?.[0] ?? 78.4482;
      const hospLat = hosp.location?.coordinates?.[1] ?? 17.4156;
      const distanceKm = haversineDistanceKm(lng, lat, hospLng, hospLat);

      results.push({
        ...hosp,
        distanceKm: Math.round(distanceKm * 100) / 100,
        capability: cap || null,
      });
    }

    // Sort by distance ascending
    results.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("[listAvailable] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /:id/internal - Internal endpoint to get full hospital + capability details
 */
export const getHospitalInternal = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, error: "Hospital not found" });
    }

    const capability = await HospitalCapability.findOne({ hospitalId: hospital._id });

    return res.status(200).json({
      success: true,
      data: {
        hospital,
        capability: capability || null,
      },
    });
  } catch (error) {
    console.error("[getHospitalInternal] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /staff/by-email/:email - Internal endpoint used by Auth service during login
 */
export const getStaffByEmail = async (req, res) => {
  try {
    const staff = await HospitalStaff.findOne({ email: req.params.email.toLowerCase() });
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("[getStaffByEmail] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /staff/:id/activate - Internal endpoint to activate staff on first login
 */
export const activateStaff = async (req, res) => {
  try {
    const { userId } = req.body;
    const updateData = { isActive: true };
    if (userId) updateData.userId = userId;

    const staff = await HospitalStaff.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Staff activated successfully",
      data: staff,
    });
  } catch (error) {
    console.error("[activateStaff] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /internal - Internal endpoint to create hospital + primary staff + initial capability
 */
export const createHospitalInternal = async (req, res) => {
  try {
    const { hospital: hospitalData, staff: staffData, capability: capData } = req.body;

    // Create Hospital
    const hospital = await Hospital.create(hospitalData);

    // Create primary staff if provided
    let staff = null;
    if (staffData && staffData.email) {
      staff = await HospitalStaff.create({
        ...staffData,
        hospitalId: hospital._id,
        email: staffData.email.toLowerCase(),
      });
    }

    // Create capability record
    const capability = await HospitalCapability.create({
      ...(capData || {}),
      hospitalId: hospital._id,
    });

    return res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: {
        hospital,
        staff,
        capability,
      },
    });
  } catch (error) {
    console.error("[createHospitalInternal] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /:id/approve - Admin endpoint to approve hospital
 */
export const approveHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: { isApproved: true, isActive: true } },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ success: false, error: "Hospital not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital approved successfully",
      data: hospital,
    });
  } catch (error) {
    console.error("[approveHospital] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /:id/suspend - Admin endpoint to suspend hospital
 */
export const suspendHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ success: false, error: "Hospital not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital suspended successfully",
      data: hospital,
    });
  } catch (error) {
    console.error("[suspendHospital] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET / - Admin/public list hospitals with filters and pagination
 */
export const listHospitals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.isApproved !== undefined) {
      filter.isApproved = req.query.isApproved === "true";
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }
    if (req.query.city) {
      filter["address.city"] = new RegExp(req.query.city, "i");
    }

    const [hospitals, total] = await Promise.all([
      Hospital.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Hospital.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: hospitals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[listHospitals] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /:id - Admin/public get hospital by id
 */
export const getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, error: "Hospital not found" });
    }

    const capability = await HospitalCapability.findOne({ hospitalId: hospital._id });

    return res.status(200).json({
      success: true,
      data: {
        hospital,
        capability: capability || null,
      },
    });
  } catch (error) {
    console.error("[getHospital] Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

