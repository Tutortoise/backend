import { auth } from "@/config";
import { app } from "@/main";
import { seedSubjects } from "@/seeders/subject.seeder";
import { faker } from "@faker-js/faker";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";

const firebaseApp = initializeApp({
  apiKey: "test-api-key",
  authDomain: "localhost",
  projectId: "tutortoise-test",
});
const clientAuth = getAuth(firebaseApp);
connectAuthEmulator(clientAuth, "http://localhost:9099");

async function getIdToken(userId: string) {
  const customToken = await auth.createCustomToken(userId);
  const { user } = await signInWithCustomToken(clientAuth, customToken);
  return user.getIdToken();
}

beforeAll(async () => {
  await seedSubjects();
});

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

  const idToken = await getIdToken(userId);
  return { idToken, userId };
}

describe("Update learner profile", async () => {
  let idToken: string;

  test("should be able to update learner profile", async () => {
    const { idToken: token } = await registerLearner();
    idToken = token;

    const updatedProfile = {
      name: faker.person.fullName(),
      phoneNum: "+62812121212",
      gender: "male",
      learningStyle: "visual",
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

describe("Update learner password", async () => {
  let idToken: string;

  beforeAll(async () => {
    const { idToken: token } = await registerLearner();
    idToken = token;
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
});
