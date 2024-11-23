import { app } from "@/main";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { container } from "@/container";
import { generateUser } from "@tests/helpers/generate.helper";
import { faker } from "@faker-js/faker";

const subjectRepository = container.subjectRepository;
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
  const { token } = await registerAndLoginLearner();

  test("Get all tutories without token", async () => {
    await supertest(app).get("/api/v1/tutors/services").expect(401);
  });

  test("Get all tutories with token", async () => {
    await supertest(app)
      .get("/api/v1/tutors/services")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  test("Get all tutories with filter", async () => {
    // Filter by tutor name / subject name
    const q = "z";
    const qParameterRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ q })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    for (const tutories of qParameterRes.body.data) {
      expect(
        tutories.tutorName.toLowerCase().includes(q) ||
          tutories.subjectName.toLowerCase().includes(q),
      ).toBe(true);
    }

    // Filter by subjectId
    const subject = faker.helpers.arrayElement(
      await subjectRepository.getAllSubjects(),
    );
    const subjectIdParameterRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ subjectId: subject.id })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    for (const tutories of subjectIdParameterRes.body.data) {
      expect(tutories.subjectName).toBe(subject.name);
    }

    // Filter by hourlyRate
    const hourlyRate = 100000;
    const hourlyRateParameterRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ minHourlyRate: hourlyRate })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    for (const tutories of hourlyRateParameterRes.body.data) {
      expect(tutories.hourlyRate).toBeGreaterThanOrEqual(hourlyRate);
    }

    // Filter by typeLesson
    const typeLesson = "online";
    const typeLessonParameterRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ typeLesson })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    for (const tutories of typeLessonParameterRes.body.data) {
      expect(tutories.typeLesson).toBe(typeLesson);
    }

    // Filter by city
    const city = "Samarinda";
    const cityParameterRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ city })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    for (const tutories of cityParameterRes.body.data) {
      expect(tutories.city.toLowerCase()).toBe(city.toLowerCase());
    }

    // Filter by multiple filters
    const multipleFiltersRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ q, subjectId: subject.id, minHourlyRate: hourlyRate })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    for (const tutories of multipleFiltersRes.body.data) {
      expect(
        tutories.tutorName.toLowerCase().includes(q) ||
          tutories.subjectName.toLowerCase().includes(q),
      ).toBe(true);
      expect(tutories.subjectName).toBe(subject.name);
      expect(tutories.hourlyRate).toBeGreaterThanOrEqual(hourlyRate);
    }
  });

  test("Get all tutories with invalid filter", async () => {
    const invalidFilterRes = await supertest(app)
      .get(`/api/v1/tutors/services`)
      .query({ typeLesson: "invalid", subjectId: "invalid" })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(invalidFilterRes.body.errors).toBeTruthy();
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
