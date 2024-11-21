import { auth, firestore } from "@/config";
import { app } from "@/main";
import { seedLearners } from "@/module/learner/learner.seeder";
import { seedTutors } from "@/module/tutor/tutor.seeder";
import { seedServices } from "@/module/tutor-service/tutorService.seeder";
import { faker } from "@faker-js/faker";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";

const firebaseApp = initializeApp({
  apiKey: "test-api-key",
  authDomain: "localhost",
  projectId: "tutortoise-test",
});
const clientAuth = getAuth(firebaseApp);
connectAuthEmulator(clientAuth, "http://localhost:9099");

const tsService = new TutorServiceService({ firestore });

async function getIdToken(userId: string) {
  const customToken = await auth.createCustomToken(userId);
  const { user } = await signInWithCustomToken(clientAuth, customToken);
  return user.getIdToken();
}

async function registerLearner() {
  const newLearner = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: "learner",
  };

  const res = await supertest(app)
    .post("/api/v1/auth/register")
    .send(newLearner)
    .expect(201);

  const userId = res.body.data.userId;
  expect(userId).toBeDefined();

  const idToken = await getIdToken(userId);
  return { idToken, userId };
}

describe("Order a service", () => {
  test("Learner can order a service", async () => {
    const { idToken, userId } = await registerLearner();

    const services = await tsService.getTutorServices();

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        learnerId: userId,
        tutorServiceId: services[0].id,
        sessionTime: new Date(),
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);
  });
});
