import { app } from "@/main";
import { seedTutors } from "@/module/tutor/tutor.seeder";
import { seedServices } from "@/module/tutor-service/tutorService.seeder";
import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";
import { faker } from "@faker-js/faker";
import { auth, firestore } from "@/config";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";

const tutorServiceService = new TutorServiceService({ firestore });

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

beforeAll(async () => {
  await seedTutors();
  await seedServices({ randomTeachingMethodology: true });
});

describe("Get tutor services", async () => {
  test("Get all tutor services without token", async () => {
    await supertest(app).get("/api/v1/tutors/services").expect(401);
  });

  test("Get all tutor services with token", async () => {
    const { idToken } = await registerLearner();
    await supertest(app)
      .get("/api/v1/tutors/services")
      .set("Authorization", `Bearer ${idToken}`)
      .expect(200);
  });
});

describe("Get tutor service availability", async () => {
  const tutorServices = await tutorServiceService.getTutorServices();
  const tutorServiceId = tutorServices[0].id;

  const { idToken } = await registerLearner();

  test("Get tutor service availability without token", async () => {
    await supertest(app)
      .get(`/api/v1/tutors/services/${tutorServiceId}/availability`)
      .expect(401);
  });

  test("Get tutor service availability with token", async () => {
    const res = await supertest(app)
      .get(`/api/v1/tutors/services/${tutorServiceId}/availability`)
      .set("Authorization", `Bearer ${idToken}`)
      .expect(200);

    console.log(res.body.data);
    expect(res.body.data).toBeTruthy();
  });
});
