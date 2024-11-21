import { Database } from "firebase-admin/database";
import { logger } from "@middleware/logging.middleware";
import { UserPresence, ChatRoomPresence } from "@/types";

interface PresenceServiceDependencies {
  realtimeDb: Database;
}

export class PresenceService {
  private static TYPING_TIMEOUT = 5000; // 5 seconds
  private realtimeDb: Database;

  constructor({ realtimeDb }: PresenceServiceDependencies) {
    this.realtimeDb = realtimeDb;
  }

  async updateUserPresence(
    userId: string,
    presence: Partial<UserPresence>,
  ): Promise<void> {
    try {
      const userPresenceRef = this.realtimeDb.ref(`presence/${userId}`);
      await userPresenceRef.update({
        ...presence,
        lastSeen: presence.lastSeen || Date.now(),
      });

      if (presence.isOnline) {
        userPresenceRef.onDisconnect().update({
          isOnline: false,
          lastSeen: Date.now(),
          currentChatRoom: null,
        });
      }
    } catch (error) {
      logger.error(`Failed to update user presence: ${error}`);
    }
  }

  async updateTypingStatus(
    userId: string,
    roomId: string,
    isTyping: boolean,
  ): Promise<void> {
    try {
      const roomPresenceRef = this.realtimeDb.ref(
        `rooms/${roomId}/presence/${userId}`,
      );
      await roomPresenceRef.update({
        isTyping,
        lastTypingAt: Date.now(),
      });

      if (isTyping) {
        setTimeout(async () => {
          const snapshot = await roomPresenceRef.get();
          const data = snapshot.val();
          if (
            data &&
            Date.now() - data.lastTypingAt > PresenceService.TYPING_TIMEOUT
          ) {
            await roomPresenceRef.update({ isTyping: false });
          }
        }, PresenceService.TYPING_TIMEOUT);
      }
    } catch (error) {
      logger.error(`Failed to update typing status: ${error}`);
    }
  }

  async getRoomPresence(roomId: string): Promise<ChatRoomPresence> {
    try {
      const snapshot = await this.realtimeDb
        .ref(`rooms/${roomId}/presence`)
        .get();
      return snapshot.val() || {};
    } catch (error) {
      logger.error(`Failed to get room presence: ${error}`);
      return {};
    }
  }
}
