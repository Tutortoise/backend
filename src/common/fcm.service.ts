import { messaging } from "firebase-admin";
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

  async sendChatNotification(
    recipientId: string,
    senderName: string,
    senderId: string,
    message: { content: string; type: MessageType },
    roomId: string,
  ): Promise<void> {
    const tokens = await this.deps.fcmRepository.getUserTokens(recipientId);
    if (!tokens.length) return;

    const messagePreview =
      message.type === "image" ? "📷 Image" : message.content;
    const truncatedPreview =
      messagePreview.length > 50
        ? `${messagePreview.substring(0, 47)}...`
        : messagePreview;

    const notificationMessage = {
      notification: {
        title: `New message from ${senderName || "Unknown User"}`,
        body: truncatedPreview,
      },
      data: {
        type: "chat_message",
        roomId,
        senderName: senderName || "Unknown User",
        senderId: senderId || "",
        content: truncatedPreview,
        title: `New message from ${senderName || "Unknown User"}`,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens,
    };

    const response =
      await messaging().sendEachForMulticast(notificationMessage);

    if (response.failureCount > 0) {
      const invalidTokens = response.responses
        .map((resp, idx) => (!resp.success ? tokens[idx] : null))
        .filter((token): token is string => token !== null);

      if (invalidTokens.length > 0) {
        return await this.removeInvalidTokens(recipientId, invalidTokens);
      }
    }
  }

  private async removeInvalidTokens(userId: string, invalidTokens: string[]) {
    await this.deps.fcmRepository.removeInvalidTokens(userId, invalidTokens);
  }
}
