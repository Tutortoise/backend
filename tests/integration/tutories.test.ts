import { app } from "@/main";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { container } from "@/container";
import { generateUser } from "@tests/helpers/generate.helper";

const tutoriesRepository = container.tutoriesRepository;

async function registerAndLoginLearner() {
  const newLearner = generateUser("learner");

  const res = await supertest(app)
    .post("/api/v1/auth/register")
    .send(newLearner)
    .expect(201);

  const userId = res.body.data.userId;
  expect(userId).toBeDefined();

  const loginRes = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email: newLearner.email, password: newLearner.password })
    .expect(200);

  const token = loginRes.body.data.token;
  expect(token).toBeDefined();

  return { learner: newLearner, token };
}

describe("Get tutories", async () => {
  test("Get all tutories without token", async () => {
    await supertest(app).get("/api/v1/tutors/services").expect(401);
  });

  test("Get all tutories with token", async () => {
    const { token } = await registerAndLoginLearner();
    await supertest(app)
      .get("/api/v1/tutors/services")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});

describe("Get tutories availability", async () => {
  const tutories = await tutoriesRepository.getTutories();
  const tutoriesId = tutories[0].id;

  const { token } = await registerAndLoginLearner();

  test("Get tutories availability without token", async () => {
    await supertest(app)
      .get(`/api/v1/tutors/services/${tutoriesId}/availability`)
      .expect(401);
  });

  test("Get tutories availability with token", async () => {
    const res = await supertest(app)
      .get(`/api/v1/tutors/services/${tutoriesId}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeTruthy();
  });
});
