import api from "../../utils/axios.js";

const internalSecret = import.meta.env.VITE_INTERNAL_SECRET || "change-this-to-random-string";

const getHeaders = () => ({
  "x-internal-secret": internalSecret,
});

export const chatWithAgent = async ({ prompt, incidentId, userId, conversationId }) => {
  const payload = {
    prompt,
  };

  if (incidentId) payload.incidentId = incidentId;
  if (userId) payload.userId = userId;
  if (conversationId) payload.conversationId = conversationId;

  const response = await api.post("/api/agent/chat", payload, {
    headers: getHeaders(),
  });

  return response.data;
};

export const getMessages = async ({ incidentId, userId }) => {
  const params = new URLSearchParams();

  if (userId) params.append("userId", userId);

  const response = await api.get(`/api/agent/messages/${incidentId}`, {
    headers: getHeaders(),
    params,
  });

  return response.data;
};

export const analyzeIncident = async ({ description, location, imageUrl, incidentId, userId }) => {
  const payload = {};

  if (description) payload.description = description;
  if (location) payload.location = location;
  if (imageUrl) payload.imageUrl = imageUrl;
  if (incidentId) payload.incidentId = incidentId;
  if (userId) payload.userId = userId;

  const response = await api.post("/api/agent/analyze", payload, {
    headers: getHeaders(),
  });

  return response.data;
};
