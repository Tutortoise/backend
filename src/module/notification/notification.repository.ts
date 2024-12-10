import { db as dbType } from "@/db/config";
import { notifications, NotificationType } from "@/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";

interface GetNotificationsOptions {
  limit?: number;
  before?: Date;
}

export class NotificationRepository {
  constructor(private readonly db: typeof dbType) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const [notification] = await this.db
      .insert(notifications)
      .values(data)
      .returning();

    return notification;
  }

  async getNotification(notificationId: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    return notification;
  }

  async getUserNotifications(
    userId: string,
    options?: GetNotificationsOptions,
  ) {
    const conditions = [eq(notifications.userId, userId)];

    if (options?.before) {
      conditions.push(lt(notifications.createdAt, options.before));
    }

    const query = this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    if (options?.limit) {
      return query.limit(options.limit);
    }

    return query;
  }

  async markAsRead(notificationId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}
