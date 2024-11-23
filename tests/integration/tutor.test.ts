import { app } from "@/main";
import { faker } from "@faker-js/faker";
import { generateUser } from "@tests/helpers/generate.helper";
import supertest from "supertest";
import { describe, expect, test } from "vitest";

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

describe("Update tutor profile", async () => {
  const { token } = await registerAndLoginTutor();

  test("should be able to update tutor profile", async () => {
    const updatedProfile = {
      name: faker.person.fullName(),
      phoneNum: "+62812121212",
      gender: "male",
    };

    await supertest(app)
      .patch(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedProfile)
      .expect(200);
  });

  test("should not be able to update tutor profile with invalid token", async () => {
    // no token
    await supertest(app)
      .patch(`/api/v1/tutors/profile`)
      .send({ name: faker.person.fullName() })
      .expect(401);

    // invalid token
    await supertest(app)
      .patch(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer invalid-token`)
      .send({ name: faker.person.fullName() })
      .expect(401);
  });

  test("should not be able to update tutor profile with invalid data", async () => {
    const invalidData = {
      name: "a",
      phoneNum: "invalid",
      latitude: "x",
      longitude: "y",
      gender: "sigma",
    };

    const res = await supertest(app)
      .patch(`/api/v1/tutors/profile`)
      .set("Authorization", `Bearer ${token}`)
      .send(invalidData)
      .expect(400);

    expect(res.body.status).toEqual("fail");
    expect(res.body.message).toEqual("Validation error");
    expect(res.body.errors.length).toEqual(5);
  });
});

describe("Update tutor profile picture", async () => {
  const { token } = await registerAndLoginTutor();

  test("should be able to update tutor profile picture", async () => {
    const res = await supertest(app)
      .put(`/api/v1/tutors/profile/picture`)
      .set("Authorization", `Bearer ${token}`)
      .attach("picture", "tests/integration/pictures/bocchi.png")
      .expect(200);

    const url = `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/${process.env.GCS_BUCKET_NAME}`;
    expect(res.body.data.url).toMatch(url);
  });

  test("should not be able to update tutor profile picture with invalid token", async () => {
    await supertest(app)
      .put(`/api/v1/tutors/profile/picture`)
      .attach("picture", "tests/integration/pictures/bocchi.png")
      .expect(401);
  });

  test("should not be able to update tutor profile picture with invalid data", async () => {
    await supertest(app).put(`/api/v1/tutors/profile/picture`).expect(401);
    await supertest(app)
      .put(`/api/v1/tutors/profile/picture`)
      .attach("picture", "package.json")
      .expect(401);
  });
});

describe("Update tutor password", async () => {
  const { tutor, token } = await registerAndLoginTutor();

  test("should validate password", async () => {
    const res = await supertest(app)
      .put("/api/v1/tutors/password")
      .set("Authorization", `Bearer ${token}`)
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

  test("should be able to update tutor password", async () => {
    const newPassword = faker.internet.password();
    await supertest(app)
      .put("/api/v1/tutors/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: tutor.password,
        newPassword: newPassword,
        confirmPassword: newPassword,
      })
      .expect(200);

    // try to login with old password
    const res = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: tutor.email, password: tutor.password })
      .expect(400);
    expect(res.body.message).toEqual("Invalid email or password");

    // try to login with new password
    await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: tutor.email, password: newPassword })
      .expect(200);
  });

  test("should not be able to update tutor password with invalid token", async () => {
    const newPassword = faker.internet.password();
    await supertest(app)
      .put("/api/v1/tutors/password")
      .send({
        currentPassword: "1234",
        newPassword: newPassword,
        confirmPassword: newPassword,
      })
      .expect(401);
  });
});
