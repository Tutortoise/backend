import { messaging } from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { logger } from "@middleware/logging.middleware";

interface FCMServiceDependencies {
  firestore: Firestore;
}

export class FCMService {
  private firestore: Firestore;

  constructor({ firestore }: FCMServiceDependencies) {
    this.firestore = firestore;
  }

  async storeUserToken(userId: string, token: string): Promise<void> {
    try {
      const tokensRef = this.firestore
        .collection("user_fcm_tokens")
        .doc(userId);

      const doc = await tokensRef.get();
      const existingTokens = doc.exists ? doc.data()?.tokens || [] : [];

      if (!existingTokens.includes(token)) {
        await tokensRef.set({
          tokens: [...existingTokens, token],
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error(`Failed to store FCM token: ${error}`);
      throw error;
    }
  }

  async removeUserToken(userId: string, token: string): Promise<void> {
    try {
      const tokensRef = this.firestore
        .collection("user_fcm_tokens")
        .doc(userId);

      const doc = await tokensRef.get();
      if (doc.exists) {
        const existingTokens = doc.data()?.tokens || [];
        await tokensRef.update({
          tokens: existingTokens.filter((t: string) => t !== token),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error(`Failed to remove FCM token: ${error}`);
      throw error;
    }
  }

  // TODO: Discuss with the team, how the notification should look like
  async sendChatNotification(
    recipientId: string,
    senderName: string,
    message: { content: string; type: "text" | "image" },
    roomId: string,
  ): Promise<void> {
    try {
      const tokensDoc = await this.firestore
        .collection("user_fcm_tokens")
        .doc(recipientId)
        .get();

      const tokens = tokensDoc.exists ? tokensDoc.data()?.tokens : [];
      if (!tokens?.length) return;

      const messagePreview =
        message.type === "image" ? "📷 Image" : message.content;
      const truncatedPreview =
        messagePreview.length > 50
          ? `${messagePreview.substring(0, 47)}...`
          : messagePreview;

      const notificationMessage = {
        notification: {
          title: `New message from ${senderName}`,
          body: truncatedPreview,
        },
        data: {
          type: "chat_message",
          roomId,
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
          await this.removeInvalidTokens(recipientId, invalidTokens);
        }
      }
    } catch (error) {
      logger.error(`Failed to send chat notification: ${error}`);
    }
  }

  private async removeInvalidTokens(userId: string, invalidTokens: string[]) {
    try {
      const userTokensRef = this.firestore
        .collection("user_fcm_tokens")
        .doc(userId);
      const doc = await userTokensRef.get();

      if (doc.exists) {
        const currentTokens = doc.data()?.tokens || [];
        const validTokens = currentTokens.filter(
          (token: string) => !invalidTokens.includes(token),
        );

        await userTokensRef.update({
          tokens: validTokens,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error(`Failed to remove invalid tokens: ${error}`);
    }
  }
}
