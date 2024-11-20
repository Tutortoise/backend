import { faker } from "@faker-js/faker";
import { ChatService } from "@services/chat.service";
import { describe, expect, it, vi } from "vitest";

describe("ChatService", () => {
  const mockBatch = {
    update: vi.fn(),
    commit: vi.fn(),
  };

  const mockFirestore = {
    collection: vi.fn(),
    runTransaction: vi.fn(),
    batch: vi.fn().mockReturnValue(mockBatch),
  };

  const mockBucket = {
    file: vi.fn(),
  };

  const mockPresenceService = {
    updateUserPresence: vi.fn(),
    updateTypingStatus: vi.fn(),
    getRoomPresence: vi.fn(),
  };

  const chatService = new ChatService({
    firestore: mockFirestore as any,
    bucket: mockBucket as any,
    presenceService: mockPresenceService as any,
  });

  describe("createRoom", () => {
    it("should create a new chat room", async () => {
      const learnerId = faker.string.uuid();
      const tutorId = faker.string.uuid();
      const roomId = faker.string.uuid();

      const mockLearnerDoc = {
        exists: true,
        data: () => ({ name: "Test Learner" }),
      };

      const mockTutorDoc = {
        exists: true,
        data: () => ({ name: "Test Tutor" }),
      };

      const mockSet = vi.fn();

      mockFirestore.collection.mockImplementation((name) => ({
        doc: () => ({
          get: () =>
            Promise.resolve(
              name === "learners" ? mockLearnerDoc : mockTutorDoc,
            ),
          set: mockSet,
          id: roomId,
        }),
        where: () => ({
          where: () => ({
            limit: () => ({
              get: () => Promise.resolve({ empty: true }),
            }),
          }),
        }),
      }));

      const result = await chatService.createRoom(learnerId, tutorId);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          learnerId,
          tutorId,
          learnerName: "Test Learner",
          tutorName: "Test Tutor",
        }),
      );

      expect(result).toMatchObject({
        id: roomId,
        learnerId,
        tutorId,
        learnerName: "Test Learner",
        tutorName: "Test Tutor",
      });
    });
  });

  describe("getRooms", () => {
    it("should get rooms for a user", async () => {
      const userId = faker.string.uuid();
      const mockRooms = [
        {
          id: faker.string.uuid(),
          data: () => ({
            learnerId: userId,
            tutorId: faker.string.uuid(),
            lastMessageAt: {
              toDate: () => new Date(),
            },
          }),
        },
      ];

      mockFirestore.collection.mockImplementation(() => ({
        where: () => ({
          orderBy: () => ({
            get: () => Promise.resolve({ docs: mockRooms }),
          }),
        }),
      }));

      const result = await chatService.getRooms(userId, "learner");
      expect(result).toHaveLength(1);
      expect(result[0].learnerId).toBe(userId);
    });
  });

  describe("sendMessage", () => {
    it("should send a message", async () => {
      const roomId = faker.string.uuid();
      const senderId = faker.string.uuid();
      const messageId = faker.string.uuid();
      const message = {
        content: "Test message",
        type: "text" as const,
      };

      const mockRoom = {
        exists: true,
        data: () => ({
          learnerId: senderId,
        }),
      };

      const mockTransaction = {
        set: vi.fn(),
        update: vi.fn(),
      };

      mockFirestore.collection.mockImplementation(() => ({
        doc: () => ({
          get: () => Promise.resolve(mockRoom),
          id: messageId,
        }),
      }));

      mockFirestore.runTransaction.mockImplementation((fn) =>
        Promise.resolve(fn(mockTransaction)),
      );

      const result = await chatService.sendMessage(
        roomId,
        senderId,
        "learner",
        message,
      );

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: messageId,
        roomId,
        senderId,
        content: message.content,
        type: message.type,
      });
    });
  });

  describe("getRoomMessages", () => {
    it("should get messages for a room", async () => {
      const roomId = faker.string.uuid();
      const userId = faker.string.uuid();
      const mockMessages = [
        {
          id: faker.string.uuid(),
          data: () => ({
            content: "Test message",
            sentAt: {
              toDate: () => new Date(),
            },
          }),
        },
      ];

      const mockRoom = {
        exists: true,
        data: () => ({
          learnerId: userId,
        }),
      };

      mockFirestore.collection.mockImplementation((name) => ({
        doc: () => ({
          get: () => Promise.resolve(mockRoom),
        }),
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              where: () => ({
                get: () => Promise.resolve({ docs: mockMessages }),
              }),
              get: () => Promise.resolve({ docs: mockMessages }),
            }),
          }),
        }),
      }));

      const result = await chatService.getRoomMessages(roomId, userId);
      expect(result).toHaveLength(1);
    });
  });
});
