export const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

export const sendError = (res, statusCode, message, details) => {
  const payload = {
    success: false,
    message,
  };

  if (details && process.env.NODE_ENV !== "production") {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
