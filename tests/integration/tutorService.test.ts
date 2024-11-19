import { auth } from "@/config";
import { app } from "@/main";
import { seedSubjects } from "@/seeders/subject.seeder";
import { seedTutors } from "@/seeders/tutor.seeder";
import { seedServices } from "@/seeders/tutorService.seeder";
import { TutorService } from "@/types";
import { faker } from "@faker-js/faker";
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
  await seedSubjects();
  await seedTutors();
  await seedServices({ randomTeachingMethodology: true });
});

describe("Get tutor services", async () => {
  const idToken = await getIdToken((await registerLearner()).userId);

  test("Get all tutor services without token", async () => {
    await supertest(app).get("/api/v1/tutors/services").expect(401);
  });

  test("Get all tutor services with token", async () => {
    await supertest(app)
      .get("/api/v1/tutors/services")
      .set("Authorization", `Bearer ${idToken}`)
      .expect(200);
  });
});

describe("Get tutor service availabiltiy", async () => {
  const idToken = await getIdToken((await registerLearner()).userId);

  test("Get tutor service availability with token", async () => {
    const res = await supertest(app)
      .get("/api/v1/tutors/services")
      .set("Authorization", `Bearer ${idToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();

    const randomServiceId = faker.helpers.arrayElement(
      res.body.data as TutorService[],
    ).id;

    await supertest(app)
      .get(`/api/v1/tutors/services/${randomServiceId}/availability`)
      .set("Authorization", `Bearer ${idToken}`)
      .expect(200);
  });
});
