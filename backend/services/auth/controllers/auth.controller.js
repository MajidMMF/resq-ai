import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { registerSchema, loginSchema } from "../utils/auth.schema.js";
import {
  createSession,
  setSessionCookie,
  getSession,
  refreshSessionTtl,
  destroySession,
  getCookieOptions,
} from "../services/session.service.js";
import { sendError, sendSuccess } from "../utils/apiError.js";
import { toUserResponse } from "../utils/userResponse.js";
import { env } from "../config/env.js";

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, mobile, role = "USER", ambulance, hospital } = validatedData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, "EMAIL_EXISTS", "Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      mobile,
      roles: [role],
      isActive: true,
      twoFactorEnabled: false,
      profileCompleted: true,
      firebaseUid: `uid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    });

    // If AMBULANCE_DRIVER, create ambulance & driver in ambulance-service
    if (role === "AMBULANCE_DRIVER") {
      try {
        const ambServiceUrl = process.env.AMBULANCE_SERVICE || "http://localhost:8007";
        const secret = process.env.INTERNAL_SECRET || "change-this-to-random-string";
        const plateNumber = ambulance?.plateNumber?.trim().toUpperCase() || `TS-09-EM-${Math.floor(100 + Math.random() * 900)}`;

        const ambRes = await fetch(`${ambServiceUrl}/internal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": secret,
          },
          body: JSON.stringify({
            ambulance: {
              plateNumber,
              type: ambulance?.type || "basic",
            },
            driver: {
              userId: user._id,
              name: user.name,
              email: user.email,
              phone: user.mobile,
            },
          }),
        });

        if (ambRes.ok) {
          const ambJson = await ambRes.json();
          if (ambJson?.data?.ambulance?._id) {
            user.ambulanceId = ambJson.data.ambulance._id;
            await user.save();
          }
        } else {
          console.error("Ambulance registration error:", await ambRes.text());
        }
      } catch (ambErr) {
        console.error("Failed to connect to ambulance-service:", ambErr.message);
      }
    }

    // If HOSPITAL_STAFF, create hospital & staff in hospital-service
    if (role === "HOSPITAL_STAFF") {
      try {
        const hospServiceUrl = process.env.HOSPITAL_SERVICE || "http://localhost:8006";
        const secret = process.env.INTERNAL_SECRET || "change-this-to-random-string";

        const hospRes = await fetch(`${hospServiceUrl}/internal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": secret,
          },
          body: JSON.stringify({
            hospital: {
              name: hospital?.name || `${name} Emergency Center`,
              phone: hospital?.phone || mobile,
              address: typeof hospital?.address === "string" ? hospital.address : (hospital?.address?.street || "City Center, Hyderabad"),
              location: hospital?.location || { type: "Point", coordinates: [78.4482, 17.4156] },
              isApproved: true,
              isActive: true,
              emergencyDepartmentOpen: true,
            },
            staff: {
              userId: user._id,
              name: user.name,
              email: user.email,
              phone: user.mobile,
              role: "doctor",
              status: "ACTIVE",
              isActive: true,
            },
            capability: {
              beds: 60,
              icu: 15,
              trauma: true,
              ventilators: 8,
            },
          }),
        });

        if (hospRes.ok) {
          const hospJson = await hospRes.json();
          if (hospJson?.data?.hospital?._id) {
            user.hospitalId = hospJson.data.hospital._id;
            await user.save();
          }
        } else {
          console.error("Hospital registration error:", await hospRes.text());
        }
      } catch (hospErr) {
        console.error("Failed to connect to hospital-service:", hospErr.message);
      }
    }

    const sessionId = await createSession(user);
    setSessionCookie(res, sessionId);

    return sendSuccess(
      res,
      201,
      { user: toUserResponse(user) },
      "dashboard"
    );
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "EMAIL_EXISTS", "Email already registered");
    }
    if (error.name === "ValidationError") {
      return sendError(res, 500, "REGISTER_FAILED", "Registration failed");
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return sendError(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }

    if (!user.isActive) {
      return sendError(res, 403, "ACCOUNT_DISABLED", "Account is disabled");
    }

    const sessionId = await createSession(user);
    setSessionCookie(res, sessionId);

    return sendSuccess(res, 200, { user: toUserResponse(user) }, "dashboard");
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const sessionId = req.cookies[env.SESSION_COOKIE_NAME];

    if (sessionId) {
      await destroySession(sessionId);
    }

    res.clearCookie(env.SESSION_COOKIE_NAME, getCookieOptions());

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const sessionId = req.cookies[env.SESSION_COOKIE_NAME];

    if (!sessionId) {
      return sendError(res, 401, "NO_SESSION", "No active session");
    }

    const session = await getSession(sessionId);

    if (!session) {
      res.clearCookie(env.SESSION_COOKIE_NAME, getCookieOptions());
      return sendError(res, 401, "SESSION_EXPIRED", "Session expired");
    }

    await refreshSessionTtl(sessionId);

    return sendSuccess(res, 200, session);
  } catch (error) {
    next(error);
  }
};
