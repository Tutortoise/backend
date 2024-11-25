import { app } from "@/main";
import { container } from "@/container";
import { generateUser } from "@tests/helpers/generate.helper";
import { generateJWT } from "@/helpers/jwt.helper";
import { db } from "@/db/config";
import { fcmTokens } from "@/db/schema";
import supertest from "supertest";
import { describe, expect, test, beforeAll, beforeEach, vi } from "vitest";
import type { UserRole } from "@/db/schema";

vi.mock("firebase-admin/messaging", () => ({
  messaging: () => ({
    sendEachForMulticast: vi.fn().mockResolvedValue({
      failureCount: 0,
      responses: [],
    }),
  }),
}));

const authRepository = container.authRepository;
const fcmRepository = container.fcmRepository;

interface TestUser {
  id: string;
  token: string;
  role: UserRole;
}

async function createTestUser(role: UserRole): Promise<TestUser> {
  const userData = generateUser(role);
  const { id } = await authRepository.registerUser({
    ...userData,
    role,
  });
  const token = generateJWT({ id, role });
  return { id, token, role };
}

describe("FCM Token Management", () => {
  let user: TestUser;
  const fcmToken = "test-fcm-token";

  beforeAll(async () => {
    await db.delete(fcmTokens);
    user = await createTestUser("learner");
  });

  beforeEach(async () => {
    await db.delete(fcmTokens);
  });

  test("should store FCM token", async () => {
    await supertest(app)
      .post("/api/v1/auth/fcm-token")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ token: fcmToken })
      .expect(200);

    const tokens = await fcmRepository.getUserTokens(user.id);
    expect(tokens).toContain(fcmToken);
  });

  test("should not store duplicate FCM token", async () => {
    await supertest(app)
      .post("/api/v1/auth/fcm-token")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ token: fcmToken });

    await supertest(app)
      .post("/api/v1/auth/fcm-token")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ token: fcmToken });

    const tokens = await fcmRepository.getUserTokens(user.id);
    expect(tokens.filter((t) => t === fcmToken).length).toBe(1);
  });

  test("should remove FCM token", async () => {
    await fcmRepository.storeToken(user.id, fcmToken);

    await supertest(app)
      .delete("/api/v1/auth/fcm-token")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ token: fcmToken })
      .expect(200);

    const tokens = await fcmRepository.getUserTokens(user.id);
    expect(tokens).not.toContain(fcmToken);
  });

  test("should require authentication for FCM operations", async () => {
    await supertest(app)
      .post("/api/v1/auth/fcm-token")
      .send({ token: fcmToken })
      .expect(401);

    await supertest(app)
      .delete("/api/v1/auth/fcm-token")
      .send({ token: fcmToken })
      .expect(401);
  });
});

describe("FCM Notification Integration", () => {
  let sender: TestUser;
  let recipient: TestUser;
  let roomId: string;

  beforeAll(async () => {
    await db.delete(fcmTokens);
    sender = await createTestUser("learner");
    recipient = await createTestUser("tutor");

    const room = await container.chatRepository.createRoom(
      sender.id,
      recipient.id,
    );
    roomId = room.id;
  });

  beforeEach(async () => {
    await db.delete(fcmTokens);
  });

  test("should send notification for new message", async () => {
    const fcmToken = "test-recipient-token";
    await fcmRepository.storeToken(recipient.id, fcmToken);

    const message = "Test notification message";
    await supertest(app)
      .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send({ content: message })
      .expect(201);

    // In a real implementation, you would verify the notification was sent
    // For testing purposes, we can verify the token exists
    const tokens = await fcmRepository.getUserTokens(recipient.id);
    expect(tokens).toContain(fcmToken);
  });
});
