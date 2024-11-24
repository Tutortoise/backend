import { container } from "@/container";
import { app } from "@/main";
import { faker } from "@faker-js/faker";
import { generateUser } from "@tests/helpers/generate.helper";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import { afterAll, describe, expect, test } from "vitest";

const tutorRepository = container.tutorRepository;
const tutoriesRepository = container.tutoriesRepository;
const orderRepository = container.orderRepository;

async function cleanupOrders() {
  await orderRepository.deleteAllOrders();
}

// todo: refactor to use helper later
async function loginAsTutor(tutorName: string) {
  const tutors = await tutorRepository.getAllTutors();
  const tutor = tutors.find((t) => t.name === tutorName);

  expect(tutor).toBeDefined();

  const tutorId = tutor!.id;
  const token = jwt.sign(
    { id: tutorId, role: "tutor" },
    process.env.JWT_SECRET!,
  );

  return token;
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

describe("Order a tutories", async () => {
  const { token } = await registerAndLoginLearner();

  const tutories = await tutoriesRepository.getTutories();

  afterAll(async () => {
    await cleanupOrders();
  });

  test("Learner can order a tutories", async () => {
    const availability = await tutoriesRepository.getTutoriesAvailability(
      tutories[0].id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tutoriesId: tutories[0].id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);
  });

  test("Learner cannot order a tutories with invalid session time", async () => {
    const res = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tutoriesId: tutories[0].id,
        sessionTime: new Date().toISOString(),
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(400);

    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.sessionTime",
          message: "Tutor is not available at this time",
        }),
      ]),
    );
  });
});

describe("Cancel an order", async () => {
  const tutories = await tutoriesRepository.getTutories();
  const randomTutories = faker.helpers.arrayElement(tutories);

  const { token: learnerToken } = await registerAndLoginLearner();

  afterAll(async () => {
    await cleanupOrders();
  });

  test("Tutor can cancel an order", async () => {
    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    // Create an order
    const availability = await tutoriesRepository.getTutoriesAvailability(
      randomTutories.id,
    );
    console.log(availability);

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // Cancel the order
    const orders = await tutoriesRepository.getOrders(randomTutories.id);
    const order = orders[0];
    await supertest(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);
  });

  test("Learner cannot cancel an order", async () => {
    await supertest(app)
      .post(`/api/v1/orders/x/cancel`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);
  });
});

describe("Accept an order", async () => {
  afterAll(async () => {
    await cleanupOrders();
  });

  test("Tutor can accept an order", async () => {
    const tutories = await tutoriesRepository.getTutories();
    const randomTutories = faker.helpers.arrayElement(tutories);

    const { token: learnerToken } = await registerAndLoginLearner();
    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    // Create an order
    const availability = await tutoriesRepository.getTutoriesAvailability(
      randomTutories.id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // Accept the order
    const orders = await tutoriesRepository.getOrders(randomTutories.id);
    const order = orders[0];
    await supertest(app)
      .post(`/api/v1/orders/${order.id}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);
  });
});

describe("Decline an order", async () => {
  afterAll(async () => {
    await cleanupOrders();
  });

  test("Tutor can decline an order", async () => {
    const tutories = await tutoriesRepository.getTutories();
    const randomTutories = faker.helpers.arrayElement(tutories);

    const { token: learnerToken } = await registerAndLoginLearner();
    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    // Create an order
    const availability = await tutoriesRepository.getTutoriesAvailability(
      randomTutories.id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // Decline the order
    const orders = await tutoriesRepository.getOrders(randomTutories.id);
    const order = orders[0];
    await supertest(app)
      .post(`/api/v1/orders/${order.id}/decline`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);
  });
});

describe("Handle availability edge cases", async () => {
  // afterAll(async () => {
  //   await cleanupOrders();
  // });

  test("Learner cannot order a tutories when there is already a scheduled order", async () => {
    const tutories = await tutoriesRepository.getTutories();
    const randomTutories = faker.helpers.arrayElement(tutories);

    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    const availability = await tutoriesRepository.getTutoriesAvailability(
      randomTutories.id,
    );

    // User 1 order a tutories
    const { token: learnerToken } = await registerAndLoginLearner();
    const orderByUser1 = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // User 2 order a tutories
    const { token: learnerToken2 } = await registerAndLoginLearner();
    const orderByUser2 = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken2}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availability[0],
        totalHours: 5,
        notes: "I want to learn more",
      })
      .expect(201);

    // Tutor instead accepted the order from user 2 (Tutor wants to accept the order with more hours)
    await supertest(app)
      .post(`/api/v1/orders/${orderByUser2.body.data.orderId}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);

    // User 3 tries to order a tutories
    // User 3 should not be able to order a tutories because there is already a scheduled order
    const { token: learnerToken3 } = await registerAndLoginLearner();
    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken3}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(400);

    // The other one is expected to be declined
    const orders = await tutoriesRepository.getOrders(randomTutories.id);
    const order = orders.find((o) => o.id === orderByUser1.body.data.orderId);

    expect(order).toBeDefined();
    expect(order!.status).toBe("declined");
  });

  test("Tutor cannot accept an order when there is already a scheduled order", async () => {
    const tutories = await tutoriesRepository.getTutories();
    const randomTutories = faker.helpers.arrayElement(tutories);

    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    const availabilityBefore = await tutoriesRepository.getTutoriesAvailability(
      randomTutories.id,
    );

    // User 1 order a tutories
    const totalHours = 5;
    const { token: learnerToken } = await registerAndLoginLearner();
    const orderByUser1 = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        tutoriesId: randomTutories.id,
        sessionTime: availabilityBefore[0],
        totalHours,
        notes: "I want to learn more",
      })
      .expect(201);

    // Accept the order
    await supertest(app)
      .post(`/api/v1/orders/${orderByUser1.body.data.orderId}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);

    // Make sure there is no conflicting for availabilityBefore[0]
    // Check it from availabilityAfter
    const availabilityAfter = await tutoriesRepository.getTutoriesAvailability(
      randomTutories.id,
    );

    // Get the session start and end times for the booked slot
    const sessionStart = new Date(availabilityBefore[0]);
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setHours(sessionStart.getHours() + totalHours);

    // Ensure the exact start time is no longer available
    expect(availabilityAfter).not.toContain(availabilityBefore[0]);

    // Verify that no time within the range [sessionStart, sessionEnd) is available
    availabilityAfter.forEach((availableTime) => {
      const availableDate = new Date(availableTime);
      expect(availableDate < sessionStart || availableDate >= sessionEnd).toBe(
        true,
      );
    });
  });
});
