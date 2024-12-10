import { container } from "@/container";
import { Controller } from "@/types";
import { NotificationService } from "./notification.service";
import { FCMService } from "@/common/fcm.service";
import { logger } from "@middleware/logging.middleware";
import {
  GetNotificationsSchema,
  MarkAsReadSchema,
  PaginationQuery,
} from "./notification.schema";

const notificationService = new NotificationService({
  notificationRepository: container.notificationRepository,
  fcmService: new FCMService({ fcmRepository: container.fcmRepository }),
});

export const getNotifications: Controller<GetNotificationsSchema> = async (
  req,
  res,
) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    const query = req.query as PaginationQuery;
    let parsedLimit: number | undefined;
    let parsedBefore: Date | undefined;

    if (query.limit) {
      parsedLimit = parseInt(query.limit);
    }

    if (query.before) {
      parsedBefore = new Date(query.before);
    }

    const notifications = await notificationService.getUserNotifications(
      userId,
      parsedLimit,
      parsedBefore,
    );

    res.json({
      status: "success",
      data: notifications,
    });
  } catch (error) {
    logger.error("Failed to get notifications:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get notifications",
    });
  }
};

export const markAsRead: Controller<MarkAsReadSchema> = async (req, res) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    const { notificationId } = req.params;

    // Verify notification belongs to user
    const notification =
      await notificationService.getNotification(notificationId);
    if (!notification || notification.userId !== userId) {
      res.status(403).json({
        status: "error",
        message: "You don't have permission to mark this notification as read",
      });
      return;
    }

    await notificationService.markAsRead(notificationId);

    res.json({
      status: "success",
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Failed to mark notification as read:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead: Controller = async (req, res) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    await notificationService.markAllAsRead(userId);

    res.json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    logger.error("Failed to mark all notifications as read:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to mark all notifications as read",
    });
  }
};
