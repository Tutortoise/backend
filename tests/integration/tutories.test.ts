import { container } from "@/container";
import { app } from "@/main";
import { updateProfileSchema } from "@/module/tutor/tutor.schema";
import {
  CreateTutories,
  UpdateTutories,
} from "@/module/tutories/tutories.schema";
import { faker } from "@faker-js/faker";
import { generateUser } from "@tests/helpers/generate.helper";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { z } from "zod";

const categoryRepository = container.categoryRepository;
const tutoriesRepository = container.tutoriesRepository;

async function retryOperation(operation: () => Promise<void>, retries = 50) {
  for (let i = 0; i < retries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Retry ${i + 1}/${retries}`);
    }
  }
}

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

  // generate availability
  const dayIndex = faker.number.int({ min: 0, max: 6 });
  const availability = {
    [dayIndex]: faker.helpers.arrayElements([
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
    ]),
  };

  await supertest(app)
    .patch(`/api/v1/tutors/profile`)
    .send({ availability })
    .set("Authorization", `Bearer ${loginRes.body.data.token}`)
    .expect(200);

  const token = loginRes.body.data.token;
  expect(token).toBeDefined();

  return { tutor: newTutor, token };
}

async function updateTutorProfile(token: string) {
  const data: z.infer<typeof updateProfileSchema>["body"] = {
    gender: faker.helpers.arrayElement(["male", "female", "prefer not to say"]),
    city: faker.location.city(),
    district: faker.location.city(),
  };

  await supertest(app)
    .patch(`/api/v1/tutors/profile`)
    .set("Authorization", `Bearer ${token}`)
    .send(data)
    .expect(200);
}

describe("Get tutories", async () => {
  const { token } = await registerAndLoginLearner();

  test("Get all tutories without token", async () => {
    await supertest(app).get("/api/v1/tutors/services").expect(401);
  });

  test("Get all tutories with token", async () => {
    await retryOperation(async () => {
      const tutories = await tutoriesRepository.getTutories();
      if (!tutories.length) {
        throw new Error("No tutories found in database");
      }

      const response = await supertest(app)
        .get("/api/v1/tutors/services")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    }, 30000);
  });

  test("Get all tutories with filter (query parameter)", async () => {
    await retryOperation(async () => {
      const q = "z";
      const qParameterRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ q })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      for (const tutories of qParameterRes.body.data) {
        expect(
          tutories.tutorName.toLowerCase().includes(q) ||
            tutories.categoryName.toLowerCase().includes(q),
        ).toBe(true);
      }
    }, 30000);
  });

  test("Get all tutories with filter (categoryId)", async () => {
    await retryOperation(async () => {
      const category = faker.helpers.arrayElement(
        await categoryRepository.getAllCategories(),
      );
      const categoryIdParameterRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ categoryId: category.id })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      for (const tutories of categoryIdParameterRes.body.data) {
        expect(tutories.categoryName).toBe(category.name);
      }
    }, 30000);
  });

  test("Get all tutories with filter (minHourlyRate)", async () => {
    await retryOperation(async () => {
      const hourlyRate = 100000;
      const hourlyRateParameterRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ minHourlyRate: hourlyRate })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      for (const tutories of hourlyRateParameterRes.body.data) {
        expect(tutories.hourlyRate).toBeGreaterThanOrEqual(hourlyRate);
      }
    }, 30000);
  });

  test("Get all tutories with filter (typeLesson)", async () => {
    await retryOperation(async () => {
      const typeLesson = "online";
      const typeLessonParameterRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ typeLesson })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      for (const tutories of typeLessonParameterRes.body.data) {
        expect(tutories.typeLesson).toBe(typeLesson);
      }
    }, 30000);
  });

  test("Get all tutories with filter (city)", async () => {
    await retryOperation(async () => {
      const city = "Samarinda";
      const cityParameterRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ city })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      for (const tutories of cityParameterRes.body.data) {
        expect(tutories.city.toLowerCase()).toBe(city.toLowerCase());
      }
    }, 30000);
  });

  test("Get all tutories with filter (multiple filters)", async () => {
    await retryOperation(async () => {
      const q = "z";
      const category = faker.helpers.arrayElement(
        await categoryRepository.getAllCategories(),
      );
      const hourlyRate = 100000;

      const multipleFiltersRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ q, categoryId: category.id, minHourlyRate: hourlyRate })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      for (const tutories of multipleFiltersRes.body.data) {
        expect(
          tutories.tutorName.toLowerCase().includes(q) ||
            tutories.categoryName.toLowerCase().includes(q),
        ).toBe(true);
        expect(tutories.categoryName).toBe(category.name);
        expect(tutories.hourlyRate).toBeGreaterThanOrEqual(hourlyRate);
      }
    }, 30000);
  });

  test("Get all tutories with invalid filter", async () => {
    await retryOperation(async () => {
      const invalidFilterRes = await supertest(app)
        .get(`/api/v1/tutors/services`)
        .query({ typeLesson: "invalid", categoryId: "invalid" })
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(invalidFilterRes.body.errors).toBeTruthy();
    });
  }, 30000);
}, 60000); // This is a highly expensive operation, so we need to increase the timeout
// TODO: Optimize the query so we don't need to setup long timeout

describe("Create tutories", async () => {
  const { token } = await registerAndLoginTutor();
  updateTutorProfile(token);

  const categories = await categoryRepository.getAllCategories();
  const randomCategory = faker.helpers.arrayElement(categories);

  test("Create tutories without token", async () => {
    await supertest(app).post("/api/v1/tutors/services").expect(401);
  });

  test("Create tutories with token", async () => {
    const newTutories: CreateTutories = {
      name: faker.lorem.words(),
      categoryId: randomCategory.id,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
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
      categoryId: "",
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
  updateTutorProfile(token);

  test("Update tutories without token", async () => {
    await supertest(app)
      .put(`/api/v1/tutors/services/${tutoriesId}`)
      .expect(401);
  });

  test("Update tutories with token, but not your own", async () => {
    const updatedTutories: UpdateTutories = {
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
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
    const categories = await categoryRepository.getAllCategories();
    const randomCategory = faker.helpers.arrayElement(categories);
    const newTutories: CreateTutories = {
      name: faker.lorem.words(),
      categoryId: randomCategory.id,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
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
    const updatedTutories: UpdateTutories = {
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
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
      categoryId: "",
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
  updateTutorProfile(token);

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
    const categories = await categoryRepository.getAllCategories();
    const randomCategory = faker.helpers.arrayElement(categories);

    const newTutories: CreateTutories = {
      name: faker.lorem.words(),
      categoryId: randomCategory.id,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
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
  const tutorId = tutories[0].tutorId;

  const { token } = await registerAndLoginLearner();

  test("Get tutories availability without token", async () => {
    await supertest(app)
      .get(`/api/v1/tutors/${tutorId}/availability`)
      .expect(401);
  });

  test("Get tutories availability with token", async () => {
    const res = await supertest(app)
      .get(`/api/v1/tutors/${tutorId}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeTruthy();
  });
});
