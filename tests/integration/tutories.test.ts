import { app } from "@/main";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { container } from "@/container";
import { generateUser } from "@tests/helpers/generate.helper";
import { faker } from "@faker-js/faker";
import { Tutories } from "@/types";

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

async function registerAndLoginTutor() {
  const newTutor = generateUser("tutor");

  const res = await supertest(app)
    .post("/api/v1/auth/register")
    .send(newTutor)
    .expect(201);

  const userId = res.body.data.userId;
  expect(userId).toBeDefined();

  const loginRes = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email: newTutor.email, password: newTutor.password })
    .expect(200);

  const token = loginRes.body.data.token;
  expect(token).toBeDefined();

  return { tutor: newTutor, token };
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

describe("Create tutories", async () => {
  const { token } = await registerAndLoginTutor();

  const subjects = await subjectRepository.getAllSubjects();
  const randomSubject = faker.helpers.arrayElement(subjects);

  test("Create tutories without token", async () => {
    await supertest(app).post("/api/v1/tutors/services").expect(401);
  });

  test("Create tutories with token", async () => {
    const dayIndex = faker.number.int({ min: 0, max: 6 });
    const newTutories: Omit<Tutories, "tutorId"> = {
      subjectId: randomSubject.id,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
      availability: {
        [dayIndex]: faker.helpers.arrayElements([
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
        ]),
      },
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: faker.lorem.paragraph(),
    };

    await supertest(app)
      .post("/api/v1/tutors/services")
      .send(newTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
  });

  test("Create tutories with invalid data", async () => {
    const invalidTutories = {
      subjectId: "",
      hourlyRate: 0,
      typeLesson: "invalid",
    };

    const invalidTutoriesRes = await supertest(app)
      .post("/api/v1/tutors/services")
      .send(invalidTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(invalidTutoriesRes.body.errors).toBeTruthy();
  });
});

describe("Update tutories", async () => {
  const tutories = await tutoriesRepository.getTutories();
  const tutoriesId = tutories[0].id;

  const { token } = await registerAndLoginTutor();

  test("Update tutories without token", async () => {
    await supertest(app)
      .put(`/api/v1/tutors/services/${tutoriesId}`)
      .expect(401);
  });

  test("Update tutories with token, but not your own", async () => {
    const dayIndex = faker.number.int({ min: 0, max: 6 });
    const updatedTutories: Omit<Tutories, "tutorId" | "subjectId"> = {
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
      availability: {
        [dayIndex]: faker.helpers.arrayElements([
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
        ]),
      },
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: faker.lorem.paragraph(),
    };

    const res = await supertest(app)
      .patch(`/api/v1/tutors/services/${tutoriesId}`)
      .send(updatedTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body.message).toBe(
      "You are not authorized to update this tutor service",
    );
  });

  test("Update tutories with token", async () => {
    // create new tutories
    const { token } = await registerAndLoginTutor();
    const subjects = await subjectRepository.getAllSubjects();
    const randomSubject = faker.helpers.arrayElement(subjects);

    const dayIndex = faker.number.int({ min: 0, max: 6 });
    const newTutories: Omit<Tutories, "tutorId"> = {
      subjectId: randomSubject.id,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
      availability: {
        [dayIndex]: faker.helpers.arrayElements([
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
        ]),
      },
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: faker.lorem.paragraph(),
    };

    const createTutoriesRes = await supertest(app)
      .post("/api/v1/tutors/services")
      .send(newTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const createdTutoriesId = createTutoriesRes.body.data.tutoriesId;

    // update the tutories
    const updatedTutories: Omit<Tutories, "tutorId" | "subjectId"> = {
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
      availability: {
        [dayIndex]: faker.helpers.arrayElements([
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
        ]),
      },
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: faker.lorem.paragraph(),
    };

    await supertest(app)
      .patch(`/api/v1/tutors/services/${createdTutoriesId}`)
      .send(updatedTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  test("Update tutories with invalid data", async () => {
    const invalidTutories = {
      subjectId: "",
      hourlyRate: 0,
      typeLesson: "invalid",
    };

    const invalidTutoriesRes = await supertest(app)
      .patch(`/api/v1/tutors/services/${tutoriesId}`)
      .send(invalidTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(invalidTutoriesRes.body.errors).toBeTruthy();
  });
});

describe("Delete tutories", async () => {
  const tutories = await tutoriesRepository.getTutories();
  const tutoriesId = tutories[0].id;

  const { token } = await registerAndLoginTutor();

  test("Delete tutories without token", async () => {
    await supertest(app)
      .delete(`/api/v1/tutors/services/${tutoriesId}`)
      .expect(401);
  });

  test("Delete tutories with token, but not your own", async () => {
    const res = await supertest(app)
      .delete(`/api/v1/tutors/services/${tutoriesId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body.message).toBe(
      "You are not authorized to delete this tutor service",
    );
  });

  test("Delete tutories with token", async () => {
    // create new tutories
    const { token } = await registerAndLoginTutor();
    const subjects = await subjectRepository.getAllSubjects();
    const randomSubject = faker.helpers.arrayElement(subjects);

    const dayIndex = faker.number.int({ min: 0, max: 6 });
    const newTutories: Omit<Tutories, "tutorId"> = {
      subjectId: randomSubject.id,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
      availability: {
        [dayIndex]: faker.helpers.arrayElements([
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
        ]),
      },
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: faker.lorem.paragraph(),
    };

    const createTutoriesRes = await supertest(app)
      .post("/api/v1/tutors/services")
      .send(newTutories)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const createdTutoriesId = createTutoriesRes.body.data.tutoriesId;

    // delete the tutories
    await supertest(app)
      .delete(`/api/v1/tutors/services/${createdTutoriesId}`)
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
