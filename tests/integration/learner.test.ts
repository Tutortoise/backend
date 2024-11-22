import { firestore } from "@/config";
import { app } from "@/main";
import { faker } from "@faker-js/faker";
import { SubjectService } from "@/module/subject/subject.service";
import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";
import { login } from "@tests/helpers/client.helper";

const subjectService = new SubjectService({ firestore });

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

describe("Update learner profile", async () => {
  let idToken: string;

  test("should be able to update learner profile", async () => {
    const { idToken: token } = await registerLearner();
    idToken = token;

    const subjects = await subjectService.getAllSubjects();

    const updatedProfile = {
      name: faker.person.fullName(),
      phoneNum: "+62812121212",
      gender: "male",
      learningStyle: "visual",
      interests: [subjects[0].id, subjects[1].id],
    };

    await supertest(app)
      .patch(`/api/v1/learners/profile`)
      .set("Authorization", `Bearer ${idToken}`)
      .send(updatedProfile)
      .expect(200);
  });

  test("should not be able to update learner profile with invalid token", async () => {
    // no token
    await supertest(app)
      .patch(`/api/v1/learners/profile`)
      .send({ name: faker.person.fullName() })
      .expect(401);

    // invalid token
    await supertest(app)
      .patch(`/api/v1/learners/profile`)
      .set("Authorization", `Bearer invalid-token`)
      .send({ name: faker.person.fullName() })
      .expect(401);
  });

  test("should not be able to update learner profile with invalid data", async () => {
    const { idToken: token } = await registerLearner();
    idToken = token;

    const invalidData = {
      name: "a",
      phoneNum: "invalid",
      location: {
        latitude: "x",
        longitude: "y",
      },
      gender: "sigma",
      learningStyle: "invalid",
      interests: ["invalidId"],
    };

    const res = await supertest(app)
      .patch(`/api/v1/learners/profile`)
      .set("Authorization", `Bearer ${idToken}`)
      .send(invalidData)
      .expect(400);

    expect(res.body.status).toEqual("fail");
    expect(res.body.message).toEqual("Validation error");
    expect(res.body.errors.length).toEqual(7);
  });
});

describe("Update learner profile picture", async () => {
  let idToken: string;

  beforeAll(async () => {
    const { idToken: token } = await registerLearner();
    idToken = token;
  });

  test("should be able to update learner profile picture", async () => {
    const res = await supertest(app)
      .put(`/api/v1/learners/profile/picture`)
      .set("Authorization", `Bearer ${idToken}`)
      .attach("picture", "tests/integration/pictures/bocchi.png")
      .expect(200);

    const url = `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/${process.env.GCS_BUCKET_NAME}`;
    expect(res.body.data.url).toMatch(url);
  });

  test("should not be able to update learner profile picture with invalid token", async () => {
    await supertest(app)
      .put(`/api/v1/learners/profile/picture`)
      .attach("picture", "tests/integration/pictures/bocchi.png")
      .expect(401);
  });

  test("should not be able to update learner profile picture with invalid data", async () => {
    await supertest(app).put(`/api/v1/learners/profile/picture`).expect(401);
    await supertest(app)
      .put(`/api/v1/learners/profile/picture`)
      .attach("picture", "package.json")
      .expect(401);
  });
});

describe("Update learner password", async () => {
  let idToken: string;

  beforeAll(async () => {
    const { idToken: token } = await registerLearner();
    idToken = token;
  });

  test("should validate password", async () => {
    const res = await supertest(app)
      .put("/api/v1/learners/password")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        currentPassword: "1234",
        newPassword: "123",
        confirmPassword: "123",
      })
      .expect(400);

    expect(res.body.errors[0].message).toEqual(
      "Password must be at least 8 characters",
    );
  });

  test("should be able to update learner password", async () => {
    const newPassword = faker.internet.password();
    await supertest(app)
      .put("/api/v1/learners/password")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        currentPassword: "1234",
        newPassword: newPassword,
        confirmPassword: newPassword,
      })
      .expect(200);
  });

  test("should not be able to update learner password with invalid token", async () => {
    const newPassword = faker.internet.password();
    await supertest(app)
      .put("/api/v1/learners/password")
      .send({
        currentPassword: "1234",
        newPassword: newPassword,
        confirmPassword: newPassword,
      })
      .expect(401);
  });
});
