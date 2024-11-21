import { firestore } from "@/config";
import { app } from "@/main";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { faker } from "@faker-js/faker";
import { login } from "@tests/helpers/client.helper";
import supertest from "supertest";
import { describe, expect, test } from "vitest";

const tsService = new TutorServiceService({ firestore });

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
