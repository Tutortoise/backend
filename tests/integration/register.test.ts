import { app } from "@/main";
import { faker } from "@faker-js/faker";
import supertest from "supertest";
import { describe, expect, test } from "vitest";

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

describe("Invalid registration", () => {
  test("should not allow to register", async () => {
    const newLearner = {
      name: "a",
      email: "invalid-email",
      password: "1234",
      role: "invalid",
    };

    await supertest(app)
      .post("/api/v1/auth/register")
      .send(newLearner)
      .expect(400)
      .then((response) => {
        expect(response.body.status).toEqual("fail");
        expect(response.body.message).toEqual("Validation error");
        expect(response.body.errors.length).toEqual(4);
      });
  });
});
