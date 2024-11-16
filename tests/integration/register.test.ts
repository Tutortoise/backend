import { app } from "@/main";
import { faker } from "@faker-js/faker";
import supertest from "supertest";
import { describe, test } from "vitest";

describe("Register as learner", () => {
  test("should register as learner correctly", async () => {
    const newLearner = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: "learner",
    };

    await supertest(app)
      .post("/api/v1/auth/register")
      .send(newLearner)
      .expect(201);
  });
});

describe("Register as tutor", () => {
  test("should register as tutor correctly", async () => {
    const newTutor = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: "tutor",
    };

    await supertest(app)
      .post("/api/v1/auth/register")
      .send(newTutor)
      .expect(201);
  });
});
