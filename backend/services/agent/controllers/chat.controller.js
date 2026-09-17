
import { addMessage } from "../config/memory.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

/* ──────────────────────────────────────────
   CREATE / GET CONVERSATION
   Ek incident = ek conversation
   ────────────────────────────────────────── */
export const createConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { incidentId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "MISSING_USER",
      });
    }

    if (!incidentId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_INCIDENT_ID",
      });
    }

    // Find existing or create
    let conversation = await Conversation.findOne({ incidentId, userId });

    if (!conversation) {
      conversation = await Conversation.create({
        incidentId,
        userId,
        title: "Emergency Chat",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("createConversation error:", error);
    return res.status(500).json({
      success: false,
      code: "CONVERSATION_FAILED",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   GET ALL CONVERSATIONS (for user)
   ────────────────────────────────────────── */
export const getConversations = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const conversations = await Conversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("getConversations error:", error);
    return res.status(500).json({
      success: false,
      code: "CONVERSATIONS_FAILED",
    });
  }
};

/* ──────────────────────────────────────────
   UPDATE CONVERSATION (title only)
   ────────────────────────────────────────── */
export const updateConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id, title } = req.body;

    if (!id || !title) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId },              // ownership check
      { title },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        code: "CONVERSATION_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("updateConversation error:", error);
    return res.status(500).json({
      success: false,
      code: "UPDATE_FAILED",
    });
  }
};

/* ──────────────────────────────────────────
   SAVE MESSAGE (internal helper)
   Called from ai.controller after graph invoke
   ────────────────────────────────────────── */
export const saveMessage = async (req, res) => {
  try {
    const { conversationId, incidentId, role, content, images, artifacts } = req.body;
    const userId = req.headers["x-user-id"];

    if (!conversationId || !role || !content) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
      });
    }

    const message = await Message.create({
      conversationId,
      incidentId,
      userId,
      role,
      content,
      images: images || [],
      artifacts: artifacts || [],
    });

    // Update conversation lastMessageAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: new Date(),
    });

    // Add to Redis memory (fast access)
    if (incidentId && userId) {
      await addMessage(incidentId, userId, role, content).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("saveMessage error:", error);
    return res.status(500).json({
      success: false,
      code: "SAVE_FAILED",
      message: error.message,
    });
  }
};

/* ──────────────────────────────────────────
   GET MESSAGES (by incidentId)
   ────────────────────────────────────────── */
export const getMessage = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { incidentId } = req.params;

    // Find conversation first (ownership)
    const conversation = await Conversation.findOne({ incidentId, userId });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("getMessage error:", error);
    return res.status(500).json({
      success: false,
      code: "MESSAGES_FAILED",
    });
  }
};