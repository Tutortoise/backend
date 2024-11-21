import { app } from "@/main";
import { firestore } from "@/config";
import { faker } from "@faker-js/faker";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { login } from "@tests/helpers/client.helper";

// async function cleanupCollections() {
//   const collections = ["user_fcm_tokens", "learners", "tutors"];
//   for (const collection of collections) {
//     const snapshot = await firestore.collection(collection).get();
//     const batch = firestore.batch();
//     snapshot.docs.forEach((doc) => {
//       batch.delete(doc.ref);
//     });
//     await batch.commit();
//   }
// }

async function registerUser(role: "learner" | "tutor") {
  const userData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role,
  };

  const res = await supertest(app)
    .post("/api/v1/auth/register")
    .send(userData)
    .expect(201);

  const userId = res.body.data.userId;
  expect(userId).toBeDefined();

  const idToken = await login(userId);
  return { userId, token: idToken };
}

describe("FCM Token Management", () => {
  // beforeAll(async () => {
  //   await cleanupCollections();
  // });

  // beforeEach(async () => {
  //   await cleanupCollections();
  // });

  describe("Store FCM Token", () => {
    test("should store FCM token for authenticated user", async () => {
      const { userId, token } = await registerUser("learner");
      const fcmToken = faker.string.uuid();

      const res = await supertest(app)
        .post("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmToken })
        .expect(200);

      expect(res.body.status).toBe("success");

      const tokenDoc = await firestore
        .collection("user_fcm_tokens")
        .doc(userId)
        .get();
      expect(tokenDoc.exists).toBe(true);
      expect(tokenDoc.data()?.tokens).toContain(fcmToken);
    });

    test("should not store duplicate FCM token", async () => {
      const { userId, token } = await registerUser("tutor");
      const fcmToken = faker.string.uuid();

      await supertest(app)
        .post("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmToken })
        .expect(200);

      await supertest(app)
        .post("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmToken })
        .expect(200);

      const tokenDoc = await firestore
        .collection("user_fcm_tokens")
        .doc(userId)
        .get();
      const tokens = tokenDoc.data()?.tokens || [];
      expect(tokens.filter((t: string) => t === fcmToken).length).toBe(1);
    });

    test("should require authentication", async () => {
      await supertest(app)
        .post("/api/v1/auth/fcm-token")
        .send({ token: faker.string.uuid() })
        .expect(401);
    });
  });

  describe("Remove FCM Token", () => {
    test("should remove FCM token for authenticated user", async () => {
      const { userId, token } = await registerUser("learner");
      const fcmToken = faker.string.uuid();

      await supertest(app)
        .post("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmToken })
        .expect(200);

      await supertest(app)
        .delete("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmToken })
        .expect(200);

      const tokenDoc = await firestore
        .collection("user_fcm_tokens")
        .doc(userId)
        .get();
      expect(tokenDoc.data()?.tokens).not.toContain(fcmToken);
    });

    test("should handle removing non-existent token", async () => {
      const { token } = await registerUser("tutor");
      const fcmToken = faker.string.uuid();

      await supertest(app)
        .delete("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmToken })
        .expect(200);
    });

    test("should require authentication", async () => {
      await supertest(app)
        .delete("/api/v1/auth/fcm-token")
        .send({ token: faker.string.uuid() })
        .expect(401);
    });
  });

  describe("Multi-device support", () => {
    test("should support multiple FCM tokens per user", async () => {
      const { userId, token } = await registerUser("learner");
      const fcmTokens = [faker.string.uuid(), faker.string.uuid()];

      for (const fcmToken of fcmTokens) {
        await supertest(app)
          .post("/api/v1/auth/fcm-token")
          .set("Authorization", `Bearer ${token}`)
          .send({ token: fcmToken })
          .expect(200);
      }

      const tokenDoc = await firestore
        .collection("user_fcm_tokens")
        .doc(userId)
        .get();
      const storedTokens = tokenDoc.data()?.tokens || [];
      expect(storedTokens).toHaveLength(fcmTokens.length);
      fcmTokens.forEach((token) => {
        expect(storedTokens).toContain(token);
      });
    });

    test("should handle removing specific token from multiple devices", async () => {
      const { userId, token } = await registerUser("tutor");
      const fcmTokens = [faker.string.uuid(), faker.string.uuid()];

      for (const fcmToken of fcmTokens) {
        await supertest(app)
          .post("/api/v1/auth/fcm-token")
          .set("Authorization", `Bearer ${token}`)
          .send({ token: fcmToken })
          .expect(200);
      }

      await supertest(app)
        .delete("/api/v1/auth/fcm-token")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: fcmTokens[0] })
        .expect(200);

      const tokenDoc = await firestore
        .collection("user_fcm_tokens")
        .doc(userId)
        .get();
      const storedTokens = tokenDoc.data()?.tokens || [];
      expect(storedTokens).not.toContain(fcmTokens[0]);
      expect(storedTokens).toContain(fcmTokens[1]);
    });
  });
});
