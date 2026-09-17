import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import redis from "../config/redis.js";
import {
  createAndEmit,
  decrementUnread,
  clearUnread,
} from "../services/notify.service.js";
import {
  createNotificationSchema,
  listQuerySchema,
} from "../validators/notification.validator.js";

/**
 * GET /api/notifications - List user's notifications with pagination & filter
 */
export const listNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const query = listQuerySchema.parse(req.query);

    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    if (query.read !== undefined) {
      filter.read = query.read;
    }

    const skip = (query.page - 1) * query.limit;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: error.errors[0]?.message || "Invalid query parameters",
        errors: error.errors,
      });
    }
    console.error("[listNotifications] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * GET /api/notifications/unread-count - Get user's unread notification count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `notifications:unread:${userId}`;

    // 1. Try Redis cache
    let count = await redis.get(cacheKey);

    if (count !== null) {
      return res.status(200).json({
        success: true,
        data: { count: Math.max(0, parseInt(count, 10)) },
      });
    }

    // 2. Cache miss: Count from MongoDB
    const dbCount = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      read: false,
    });

    // 3. Set Redis cache (1 hour TTL or persistent)
    await redis.set(cacheKey, dbCount, "EX", 3600);

    return res.status(200).json({
      success: true,
      data: { count: dbCount },
    });
  } catch (error) {
    console.error("[getUnreadCount] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * PATCH /api/notifications/:id/read - Mark specific notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid notification ID format",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found",
      });
    }

    // Ownership check
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You are not authorized to modify this notification",
      });
    }

    // If already read, return without decrementing
    if (notification.read) {
      return res.status(200).json({
        success: true,
        data: notification,
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    // Decrement unread count in Redis
    await decrementUnread(userId);

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("[markAsRead] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * PATCH /api/notifications/read-all - Mark all user's notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    // Reset Redis unread cache to 0
    await clearUnread(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("[markAllAsRead] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * DELETE /api/notifications/:id - Delete a specific notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid notification ID format",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found",
      });
    }

    // Ownership check
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You are not authorized to delete this notification",
      });
    }

    // If unread, decrement Redis cache
    if (!notification.read) {
      await decrementUnread(userId);
    }

    await notification.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("[deleteNotification] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * DELETE /api/notifications/all - Delete all notifications of the user
 */
export const deleteAll = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Reset Redis unread cache to 0
    await clearUnread(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("[deleteAll] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * POST /api/notifications/create [INTERNAL] - Create notification & broadcast via socket
 */
export const createNotification = async (req, res) => {
  try {
    const payload = createNotificationSchema.parse(req.body);

    const notification = await createAndEmit(payload);

    return res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: error.errors[0]?.message || "Invalid payload",
        errors: error.errors,
      });
    }
    console.error("[createNotification] Error:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: error.message,
    });
  }
};

