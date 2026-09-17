export const sendError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};

export const sendSuccess = (res, statusCode, data, nextStep) => {
  const payload = {
    success: true,
    data,
  };

  if (nextStep) {
    payload.next = nextStep;
  }

  return res.status(statusCode).json(payload);
};
