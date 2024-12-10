import { FCMService } from "@/common/fcm.service";
import { NotificationRepository } from "./notification.repository";
import { NotificationType } from "@/db/schema";
import { logger } from "@middleware/logging.middleware";

interface NotificationServiceDependencies {
  notificationRepository: NotificationRepository;
  fcmService: FCMService;
}

export class NotificationService {
  constructor(private readonly deps: NotificationServiceDependencies) {}

  async createNotification({
    userId,
    type,
    title,
    message,
    data,
  }: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    try {
      // Save to database
      const notification =
        await this.deps.notificationRepository.createNotification({
          userId,
          type,
          title,
          message,
          data,
        });

      // Send push notification
      await this.deps.fcmService.sendNotification(userId, {
        title,
        body: message,
        data: {
          type,
          ...data,
          notificationId: notification.id,
        },
      });

      return notification;
    } catch (error) {
      logger.error("Failed to create notification:", error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit?: number, before?: Date) {
    const options = {
      ...(limit && { limit }),
      ...(before && { before }),
    };

    return this.deps.notificationRepository.getUserNotifications(
      userId,
      options,
    );
  }

  async getNotification(notificationId: string) {
    return this.deps.notificationRepository.getNotification(notificationId);
  }

  async markAsRead(notificationId: string) {
    return this.deps.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    return this.deps.notificationRepository.markAllAsRead(userId);
  }
}
