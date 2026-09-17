import bcrypt from "bcryptjs";
import redis from "../config/redis.js";

const OTP_TTL = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 3;

export async function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function saveOtp(assignmentId, otp) {
  const hash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL * 1000);

  await redis.set(
    `assignment:otp:${assignmentId}`,
    JSON.stringify({ otpHash: hash, expiresAt, attempts: 0 }),
    "EX",
    OTP_TTL
  );

  return { hash, expiresAt };
}

export async function verifyOtp(assignmentId, otp, assignment) {
  // Check expiry from DB
  if (!assignment.arrivalOtpExpiresAt || assignment.arrivalOtpExpiresAt < new Date()) {
    return { ok: false, code: "OTP_EXPIRED", message: "OTP has expired" };
  }

  // Check attempts
  if (assignment.arrivalOtpAttempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      code: "TOO_MANY_ATTEMPTS",
      message: "Maximum OTP attempts exceeded",
      attemptsLeft: 0,
    };
  }

  const valid = await bcrypt.compare(String(otp).trim(), assignment.arrivalOtpHash);
  if (!valid) {
    assignment.arrivalOtpAttempts += 1;
    await assignment.save();

    const attemptsLeft = MAX_ATTEMPTS - assignment.arrivalOtpAttempts;
    return {
      ok: false,
      code: "INVALID_OTP",
      message: "Invalid OTP code",
      attemptsLeft: Math.max(0, attemptsLeft),
    };
  }

  await redis.del(`assignment:otp:${assignmentId}`);
  return { ok: true };
}

export async function clearOtp(assignmentId) {
  await redis.del(`assignment:otp:${assignmentId}`);
}

export default {
  generateOtp,
  saveOtp,
  verifyOtp,
  clearOtp,
};

