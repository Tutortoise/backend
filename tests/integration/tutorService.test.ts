import { app } from "@/main";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { faker } from "@faker-js/faker";
import { firestore } from "@/config";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { login } from "@tests/helpers/client.helper";

const tutorServiceService = new TutorServiceService({ firestore });

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

  const idToken = await login(userId);
  return { idToken, userId };
}

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

    expect(res.body.data).toBeTruthy();
  });
});
