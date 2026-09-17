import { graph } from "../graph/graph.js";
import { getMemory, addMessage } from "../config/memory.js";
import { analyzeIncidentSchema, chatMessageSchema } from "../validators/agent.validator.js";

export const analyzeIncident = async (req, res, next) => {
  try {
    const payload = analyzeIncidentSchema.parse(req.body);
    const result = await graph.invoke({
      ...payload,
      file: req.file || null,
      agent: payload.imageUrl || payload.description ? "vision" : "chatbot",
    });

    return res.status(200).json({
      success: true,
      data: result.finalResponse || result,
    });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const payload = chatMessageSchema.parse(req.body);
    const result = await graph.invoke({
      ...payload,
      agent: "chatbot",
      prompt: payload.prompt,
    });

    const assistantReply = result.aiResponse || result.finalResponse || "AI response unavailable.";

    if (payload.incidentId && payload.userId) {
      await addMessage(payload.incidentId, payload.userId, "user", payload.prompt);
      await addMessage(payload.incidentId, payload.userId, "assistant", assistantReply);
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: assistantReply,
        conversationId: result.conversationId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { userId = "temp-user" } = req.query;

    const messages = await getMemory(incidentId, userId);

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
