import { app } from "@/main";
import { container } from "@/container";
import { generateUser } from "@tests/helpers/generate.helper";
import { generateJWT } from "@/helpers/jwt.helper";
import supertest from "supertest";
import { describe, expect, test, beforeAll, beforeEach, vi } from "vitest";
import { db } from "@/db/config";
import { chatRooms, chatMessages } from "@/db/schema";
import type { UserRole } from "@/db/schema";
import { messaging } from "firebase-admin";
import { BatchResponse } from "firebase-admin/lib/messaging/messaging-api";

const chatRepository = container.chatRepository;
const authRepository = container.authRepository;

interface TestUser {
  id: string;
  token: string;
  name: string;
  role: UserRole;
}

async function createTestUser(role: UserRole): Promise<TestUser> {
  const userData = generateUser(role);

  const { id } = await authRepository.registerUser({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role,
  });

  const token = generateJWT({ id, role });

  return {
    id,
    token,
    name: userData.name,
    role,
  };
}

const mockSendEachForMulticast = vi.fn().mockResolvedValue({
  failureCount: 0,
  successCount: 1,
  responses: [{ success: true }],
});

vi.mock("firebase-admin/messaging", () => ({
  getMessaging: vi.fn(() => ({
    sendEachForMulticast: mockSendEachForMulticast,
  })),
}));

describe("Chat Module", () => {
  let learner: TestUser;
  let tutor: TestUser;
  let roomId: string;

  beforeAll(async () => {
    await db.delete(chatMessages);
    await db.delete(chatRooms);

    learner = await createTestUser("learner");
    tutor = await createTestUser("tutor");
  });

  beforeEach(async () => {
    await db.delete(chatMessages);
    mockSendEachForMulticast.mockClear();

    if (!roomId) {
      const room = await chatRepository.createRoom(learner.id, tutor.id);
      roomId = room.id;
    }
  });

  describe("Create Chat Room", () => {
    test("should create a chat room between learner and tutor", async () => {
      const res = await supertest(app)
        .post("/api/v1/chat/rooms")
        .set("Authorization", `Bearer ${learner.token}`)
        .send({
          learnerId: learner.id,
          tutorId: tutor.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");

      const room = await chatRepository.getRoomById(res.body.data.id);
      expect(room).toBeDefined();
      expect(room?.learnerId).toBe(learner.id);
      expect(room?.tutorId).toBe(tutor.id);
    });

    test("should not create room if user is not a participant", async () => {
      const otherLearner = await createTestUser("learner");

      await supertest(app)
        .post("/api/v1/chat/rooms")
        .set("Authorization", `Bearer ${otherLearner.token}`)
        .send({
          learnerId: learner.id,
          tutorId: tutor.id,
        })
        .expect(403);
    });
  });

  describe("Send Messages", () => {
    test("should send text message", async () => {
      const message = "Hello, this is a test message";
      const res = await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send({ content: message });

      expect(res.status).toBe(201);

      const messages = await chatRepository.getRoomMessages(roomId);
      const lastMessage = messages[0];
      expect(lastMessage).toMatchObject({
        content: message,
        type: "text",
        senderId: learner.id,
        senderRole: "learner",
        isRead: false,
      });
    });

    test("should send image message", async () => {
      const res = await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/image`)
        .set("Authorization", `Bearer ${tutor.token}`)
        .attach("image", "tests/integration/pictures/bocchi.png")
        .expect(201);

      expect(res.body.data).toMatchObject({
        type: "image",
        senderId: tutor.id,
        senderRole: "tutor",
        isRead: false,
      });

      const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
      const bucketName = process.env.GCS_BUCKET_NAME;
      expect(res.body.data.content).toContain(
        `http://${storageHost}/${bucketName}`,
      );
    });
  });

  describe("Get Messages", () => {
    test("should get room messages", async () => {
      const message = "Test message";
      await chatRepository.createMessage(
        roomId,
        learner.id,
        "learner",
        message,
        "text",
      );

      const res = await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .set("Authorization", `Bearer ${learner.token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test("should mark messages as read", async () => {
      await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send({ content: "Unread message" });

      await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .set("Authorization", `Bearer ${tutor.token}`)
        .expect(200);

      const messages = await chatRepository.getRoomMessages(roomId);
      expect(
        messages.every((msg) => msg.senderId !== tutor.id && msg.isRead),
      ).toBe(true);
    });
  });

  describe("Get Chat Rooms", () => {
    beforeEach(async () => {
      await chatRepository.createMessage(
        roomId,
        learner.id,
        "learner",
        "Test message",
        "text",
      );
    });

    test("should get user's chat rooms", async () => {
      const res = await supertest(app)
        .get("/api/v1/chat/rooms")
        .set("Authorization", `Bearer ${learner.token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const room = res.body.data[0];
      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("learnerId");
      expect(room).toHaveProperty("tutorId");
      expect(room).toHaveProperty("learnerName");
      expect(room).toHaveProperty("tutorName");
      expect(room).toHaveProperty("lastMessage");
    });
  });

  describe("Message Pagination", () => {
    beforeEach(async () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        roomId,
        senderId: learner.id,
        senderRole: "learner" as const,
        content: `Message ${i}`,
        type: "text" as const,
        sentAt: new Date(Date.now() - i * 1000),
        isRead: false,
      }));

      for (const msg of messages) {
        await chatRepository.createMessage(
          msg.roomId,
          msg.senderId,
          msg.senderRole,
          msg.content,
          msg.type,
        );
      }
    });

    test("should paginate messages correctly", async () => {
      const firstPage = await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages?limit=10`)
        .set("Authorization", `Bearer ${learner.token}`)
        .expect(200);

      expect(firstPage.body.data.length).toBe(10);

      const lastMessage = firstPage.body.data[firstPage.body.data.length - 1];
      const secondPage = await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .query({
          limit: 10,
          before: lastMessage.sentAt,
        })
        .set("Authorization", `Bearer ${learner.token}`)
        .expect(200);

      expect(secondPage.body.data.length).toBe(10);
      expect(new Date(secondPage.body.data[0].sentAt).getTime()).toBeLessThan(
        new Date(lastMessage.sentAt).getTime(),
      );
    });
  });

  describe("Chat Notifications", () => {
    test("should send notification when receiving message", async () => {
      const fcmToken = "test-token";
      await container.fcmRepository.storeToken(tutor.id, fcmToken);

      await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send({ content: "Test notification" })
        .expect(201);
    });

    test("should handle invalid FCM tokens", async () => {
      const invalidToken = "invalid-token";
      await container.fcmRepository.storeToken(tutor.id, invalidToken);

      mockSendEachForMulticast.mockResolvedValueOnce({
        failureCount: 1,
        successCount: 0,
        responses: [{ success: false }],
      });

      await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send({ content: "Test notification" })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const tokens = await container.fcmRepository.getUserTokens(tutor.id);
      expect(tokens).not.toContain(invalidToken);
    });

    test("should handle sending notifications for image messages", async () => {
      const fcmToken = "test-token";
      await container.fcmRepository.storeToken(tutor.id, fcmToken);

      await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/image`)
        .set("Authorization", `Bearer ${learner.token}`)
        .attach("image", "tests/integration/pictures/bocchi.png")
        .expect(201);
    });
  });

  describe("Chat Error Handling", () => {
    test("should handle unauthorized room access", async () => {
      const unauthorizedUser = await createTestUser("learner");

      await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .set("Authorization", `Bearer ${unauthorizedUser.token}`)
        .expect(401);
    });

    test("should handle invalid room ID", async () => {
      await supertest(app)
        .get(`/api/v1/chat/rooms/invalid-id/messages`)
        .set("Authorization", `Bearer ${learner.token}`)
        .expect(404);
    });

    test("should handle invalid message content", async () => {
      await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send({ content: "" })
        .expect(400);
    });
  });
});
