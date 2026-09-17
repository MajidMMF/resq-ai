import { ZodError } from "zod";
import { sendError } from "../utils/apiError.js";

const mapZodError = (error) => {
  const issue = error.issues[0];
  const field = issue.path[0];

  if (issue.code === "invalid_type" && issue.received === "undefined") {
    return {
      statusCode: 400,
      code: "MISSING_FIELDS",
      message: `${field} is required`,
    };
  }

  if (field === "email") {
    return {
      statusCode: 400,
      code: "INVALID_EMAIL",
      message: "Invalid email format",
    };
  }

  if (field === "password") {
    return {
      statusCode: 400,
      code: "WEAK_PASSWORD",
      message: issue.message,
    };
  }

  if (field === "mobile") {
    return {
      statusCode: 400,
      code: "INVALID_MOBILE",
      message: "Invalid mobile number",
    };
  }

  return {
    statusCode: 400,
    code: "MISSING_FIELDS",
    message: issue.message,
  };
};

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const mapped = mapZodError(err);
    return sendError(res, mapped.statusCode, mapped.code, mapped.message);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(
      res,
      400,
      "INVALID_JSON",
      "Invalid JSON body. Please check the request payload."
    );
  }

  if (err.code === 11000) {
    return sendError(res, 409, "EMAIL_EXISTS", "Email already registered");
  }

  console.error("Unhandled error:", err.message);
  return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong");
};
