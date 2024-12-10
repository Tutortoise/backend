import { messaging } from "@/config";
import { FCMRepository } from "./fcm.repository";
import type { MessageType } from "@/db/schema";

interface FCMServiceDependencies {
  fcmRepository: FCMRepository;
}

export class FCMService {
  constructor(private readonly deps: FCMServiceDependencies) {}

  async storeUserToken(userId: string, token: string): Promise<void> {
    await this.deps.fcmRepository.storeToken(userId, token);
  }

  async removeUserToken(userId: string, token: string): Promise<void> {
    await this.deps.fcmRepository.removeToken(userId, token);
  }

  async getUserTokens(userId: string): Promise<string[]> {
    return await this.deps.fcmRepository.getUserTokens(userId);
  }

  private async removeInvalidTokens(userId: string, invalidTokens: string[]) {
    await this.deps.fcmRepository.removeInvalidTokens(userId, invalidTokens);
  }

  async sendNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ): Promise<void> {
    const tokens = await this.getUserTokens(userId);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    if (response.failureCount > 0) {
      const invalidTokens = response.responses
        .map((resp, idx) => (!resp.success ? tokens[idx] : null))
        .filter((token): token is string => token !== null);

      if (invalidTokens.length > 0) {
        await this.removeInvalidTokens(userId, invalidTokens);
      }
    }
  }

  async sendChatNotification(
    recipientId: string,
    senderName: string,
    senderId: string,
    message: { content: string; type: MessageType },
    roomId: string,
  ): Promise<void> {
    const messagePreview =
      message.type === "image" ? "📷 Image" : message.content;
    const truncatedPreview =
      messagePreview.length > 50
        ? `${messagePreview.substring(0, 47)}...`
        : messagePreview;

    await this.sendNotification(recipientId, {
      title: `New message from ${senderName || "Unknown User"}`,
      body: truncatedPreview,
      data: {
        type: "chat_message",
        roomId,
        senderName: senderName || "Unknown User",
        senderId: senderId || "",
        content: truncatedPreview,
      },
    });
  }
}
