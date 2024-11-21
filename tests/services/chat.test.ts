import { faker } from "@faker-js/faker";
import { ChatService } from "@/module/chat/chat.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ChatService", () => {
  let mockFirestore: any;
  let mockBucket: any;
  let mockPresenceService: any;
  let mockFCMService: any;
  let chatService: ChatService;

  beforeEach(() => {
    mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn(),
          update: vi.fn(),
          set: vi.fn(),
        }),
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          }),
        }),
        add: vi.fn().mockReturnValue({ id: "mock-id" }),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        get: vi.fn(),
      }),
      batch: vi.fn().mockReturnValue({
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      }),
    };

    mockBucket = {
      file: vi.fn().mockReturnValue({
        save: vi.fn(),
        publicUrl: vi.fn(),
      }),
    };

    mockPresenceService = {
      updateUserPresence: vi.fn(),
      updateTypingStatus: vi.fn(),
      getRoomPresence: vi.fn(),
    };

    mockFCMService = {
      storeUserToken: vi.fn(),
      removeUserToken: vi.fn(),
      sendChatNotification: vi.fn(),
      removeInvalidTokens: vi.fn(),
    };

    chatService = new ChatService({
      firestore: mockFirestore,
      bucket: mockBucket,
      presenceService: mockPresenceService,
      fcmService: mockFCMService,
    });
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

      mockFirestore.collection.mockImplementation((name: string) => ({
        doc: (id?: string) => ({
          get: () =>
            Promise.resolve(
              name === "learners" ? mockLearnerDoc : mockTutorDoc,
            ),
          set: vi.fn(),
          id: roomId,
        }),
        where: () => ({
          where: () => ({
            get: () => Promise.resolve({ empty: true }),
          }),
        }),
        add: vi.fn().mockResolvedValue({ id: roomId }),
      }));

      const result = await chatService.createRoom(learnerId, tutorId);

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

      mockFirestore.collection.mockImplementation(() => ({
        doc: () => ({
          get: () => Promise.resolve(mockRoom),
          update: vi.fn(),
        }),
        add: vi.fn().mockResolvedValue({ id: messageId }),
      }));

      const result = await chatService.sendMessage(
        roomId,
        senderId,
        "learner",
        message,
      );

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

      mockFirestore.collection.mockImplementation((name: string) => ({
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
