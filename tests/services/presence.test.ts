import { PresenceService } from "@/module/chat/presence.service";
import { describe, expect, it, vi } from "vitest";
import { faker } from "@faker-js/faker";

describe("PresenceService", () => {
  const mockRealtimeDb = {
    ref: vi.fn(),
  };

  const presenceService = new PresenceService({
    realtimeDb: mockRealtimeDb as any,
  });

  describe("updateUserPresence", () => {
    it("should update user presence", async () => {
      const userId = faker.string.uuid();
      const presence = {
        isOnline: true,
        currentChatRoom: faker.string.uuid(),
      };

      const mockRef = {
        update: vi.fn(),
        onDisconnect: vi.fn().mockReturnValue({
          update: vi.fn(),
        }),
      };

      mockRealtimeDb.ref.mockReturnValue(mockRef);

      await presenceService.updateUserPresence(userId, presence);

      expect(mockRealtimeDb.ref).toHaveBeenCalledWith(`presence/${userId}`);
      expect(mockRef.update).toHaveBeenCalledWith({
        ...presence,
        lastSeen: expect.any(Number),
      });
    });
  });

  describe("updateTypingStatus", () => {
    it("should update typing status", async () => {
      const userId = faker.string.uuid();
      const roomId = faker.string.uuid();
      const isTyping = true;

      const mockRef = {
        update: vi.fn(),
        get: vi.fn().mockResolvedValue({
          val: () => ({
            lastTypingAt: Date.now(),
          }),
        }),
      };

      mockRealtimeDb.ref.mockReturnValue(mockRef);

      await presenceService.updateTypingStatus(userId, roomId, isTyping);

      expect(mockRealtimeDb.ref).toHaveBeenCalledWith(
        `rooms/${roomId}/presence/${userId}`,
      );
      expect(mockRef.update).toHaveBeenCalledWith({
        isTyping,
        lastTypingAt: expect.any(Number),
      });
    });
  });

  describe("getRoomPresence", () => {
    it("should get room presence", async () => {
      const roomId = faker.string.uuid();
      const mockPresence = {
        [faker.string.uuid()]: {
          isTyping: true,
          lastTypingAt: Date.now(),
        },
      };

      const mockRef = {
        get: vi.fn().mockResolvedValue({
          val: () => mockPresence,
        }),
      };

      mockRealtimeDb.ref.mockReturnValue(mockRef);

      const result = await presenceService.getRoomPresence(roomId);

      expect(mockRealtimeDb.ref).toHaveBeenCalledWith(
        `rooms/${roomId}/presence`,
      );
      expect(result).toEqual(mockPresence);
    });
  });
});
