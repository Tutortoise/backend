import { auth, firestore, bucket, realtimeDb } from "@/config";
import { beforeEach, afterAll, vi } from "vitest";
import { app } from "@/main";
import { faker } from "@faker-js/faker";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";
import { ChatService } from "@/module/chat/chat.service";
import { PresenceService } from "@/module/chat/presence.service";
import { AuthService } from "@/module/auth/auth.service";

const presenceService = new PresenceService({ realtimeDb });
const chatService = new ChatService({ firestore, bucket, presenceService });
const authService = new AuthService({ auth, firestore });

async function cleanupCollections() {
  const collections = ["chat_rooms", "chat_messages", "learners", "tutors"];
  for (const collection of collections) {
    const snapshot = await firestore.collection(collection).get();
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

const firebaseApp = initializeApp({
  apiKey: "test-api-key",
  authDomain: "localhost",
  projectId: "tutortoise-test",
});
const clientAuth = getAuth(firebaseApp);
connectAuthEmulator(clientAuth, "http://localhost:9099");

async function getIdToken(userId: string) {
  const customToken = await auth.createCustomToken(userId);
  const { user } = await signInWithCustomToken(clientAuth, customToken);
  return user.getIdToken();
}

async function createTestUser(role: "learner" | "tutor") {
  const userData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };

  let result;
  try {
    if (role === "learner") {
      result = await authService.registerLearner(
        userData.name,
        userData.email,
        userData.password,
      );

      const learnerDoc = await firestore
        .collection("learners")
        .doc(result.userId)
        .get();
      if (!learnerDoc.exists) {
        throw new Error("Learner document was not created");
      }
    } else {
      result = await authService.registerTutor(
        userData.name,
        userData.email,
        userData.password,
      );

      const tutorDoc = await firestore
        .collection("tutors")
        .doc(result.userId)
        .get();
      if (!tutorDoc.exists) {
        throw new Error("Tutor document was not created");
      }
    }

    const idToken = await getIdToken(result.userId);
    return { id: result.userId, token: idToken, name: userData.name };
  } catch (error) {
    console.error(`Failed to create ${role}:`, error);
    throw error;
  }
}

describe("Chat Features", () => {
  let learner: { id: string; token: string; name: string };
  let tutor: { id: string; token: string; name: string };
  let roomId: string;

  beforeAll(async () => {
    await cleanupCollections();

    [learner, tutor] = await Promise.all([
      createTestUser("learner"),
      createTestUser("tutor"),
    ]);
  });

  beforeEach(async () => {
    try {
      const room = await chatService.createRoom(learner.id, tutor.id);
      roomId = room.id;
    } catch (error) {
      console.error("Failed to create chat room:", error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupCollections();
  });

  describe("Create chat room", () => {
    test("should create a new chat room", async () => {
      const res = await supertest(app)
        .post("/api/v1/chat/rooms")
        .set("Authorization", `Bearer ${learner.token}`)
        .send({
          learnerId: learner.id,
          tutorId: tutor.id,
        })
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.learnerId).toBe(learner.id);
      expect(res.body.data.tutorId).toBe(tutor.id);
      expect(res.body.data.learnerName).toBe(learner.name);
      expect(res.body.data.tutorName).toBe(tutor.name);
    });

    test("should not allow creating room for other users", async () => {
      const otherLearnerId = faker.string.uuid();
      await supertest(app)
        .post("/api/v1/chat/rooms")
        .set("Authorization", `Bearer ${learner.token}`)
        .send({
          learnerId: otherLearnerId,
          tutorId: tutor.id,
        })
        .expect(403);
    });

    test("should require authentication", async () => {
      await supertest(app)
        .post("/api/v1/chat/rooms")
        .send({
          learnerId: learner.id,
          tutorId: tutor.id,
        })
        .expect(401);
    });
  });

  describe("Send and receive messages", () => {
    test("should send an image message", async () => {
      const response = await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/image`)
        .set("Authorization", `Bearer ${learner.token}`)
        .attach("image", "tests/integration/pictures/bocchi.png");

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.type).toBe("image");
    });

    test("should send a text message", async () => {
      const message = {
        content: faker.lorem.sentence(),
      };

      const res = await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(message)
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.content).toBe(message.content);
      expect(res.body.data.type).toBe("text");
      expect(res.body.data.senderId).toBe(learner.id);
    });

    test("should get room messages", async () => {
      const message = {
        content: "Test message content",
      };

      await supertest(app)
        .post(`/api/v1/chat/rooms/${roomId}/messages/text`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(message)
        .expect(201);

      const res = await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .set("Authorization", `Bearer ${learner.token}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("id");
      expect(res.body.data[0].content).toBe(message.content);
    });

    test("should paginate messages", async () => {
      const messages = [
        { type: "text" as const, content: "First message" },
        { type: "text" as const, content: "Second message" },
      ];

      for (const msg of messages) {
        await supertest(app)
          .post(`/api/v1/chat/rooms/${roomId}/messages`)
          .set("Authorization", `Bearer ${learner.token}`)
          .send(msg);
      }

      const firstRes = await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .set("Authorization", `Bearer ${learner.token}`)
        .query({ limit: "1" })
        .expect(200);

      expect(firstRes.body.data).toHaveLength(1);
      const firstMessage = firstRes.body.data[0];

      const secondRes = await supertest(app)
        .get(`/api/v1/chat/rooms/${roomId}/messages`)
        .set("Authorization", `Bearer ${learner.token}`)
        .query({
          before: new Date(firstMessage.sentAt).toISOString(),
          limit: "1",
        })
        .expect(200);

      expect(secondRes.body.data).toHaveLength(1);
      expect(new Date(secondRes.body.data[0].sentAt).getTime()).toBeLessThan(
        new Date(firstMessage.sentAt).getTime(),
      );
    });
  });
});
