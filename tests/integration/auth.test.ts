import { db } from "@/db/config";
import { learners, tutors } from "@/db/schema";
import { app } from "@/main";
import { faker } from "@faker-js/faker";
import supertest from "supertest";
import { afterAll, describe, expect, test } from "vitest";

function generateUser(role: "learner" | "tutor") {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role,
  };
}

async function cleanup() {
  await db.delete(learners);
  await db.delete(tutors);
}

describe("Register and login as learner", () => {
  const newLearner = generateUser("learner");

  afterAll(async () => {
    await cleanup();
  });

  test("should register as learner correctly", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send(newLearner)
      .expect(201);
  });

  test("Should be able to login", async () => {
    await supertest(app)
      .post("/api/v1/auth/login")
      .send({
        email: newLearner.email,
        password: newLearner.password,
      })
      .expect(200);
  });
});

describe("Register and login as tutor", () => {
  const newTutor = generateUser("tutor");

  afterAll(async () => {
    await cleanup();
  });

  test("should register as tutor correctly", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send(newTutor)
      .expect(201);
  });

  test("Should be able to login", async () => {
    await supertest(app)
      .post("/api/v1/auth/login")
      .send({
        email: newTutor.email,
        password: newTutor.password,
      })
      .expect(200);
  });
});

describe("Invalid registration and login", () => {
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

  test("should not allow to login", async () => {
    await supertest(app)
      .post("/api/v1/auth/login")
      .send({
        email: "random@gmail.com",
        password: "1234",
      })
      .expect(400)
      .then((response) => {
        expect(response.body.status).toEqual("fail");
        expect(response.body.message).toEqual("Invalid email or password");
      });
  });
});
