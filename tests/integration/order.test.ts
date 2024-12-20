import { container } from "@/container";
import { app } from "@/main";
import { Tutories } from "@/types";
import { faker } from "@faker-js/faker";
import { generateUser } from "@tests/helpers/generate.helper";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import { afterAll, afterEach, describe, expect, test } from "vitest";

const tutorRepository = container.tutorRepository;
const tutoriesRepository = container.tutoriesRepository;
const orderRepository = container.orderRepository;

async function getRandomTutories() {
  const tutories = await tutoriesRepository.getTutories();
  let randomTutories;
  let availability;
  do {
    randomTutories = faker.helpers.arrayElement(tutories);
    availability = await tutorRepository.getAvailability(
      randomTutories.tutorId,
    );

    if (availability.length === 0) {
      console.log("No availability found for this tutories, retrying...");
    }
  } while (availability.length === 0);
  return { randomTutories, availability };
}

function cleanupOrders(createdOrders: string[]): unknown {
  return Promise.all(
    createdOrders.map((orderId) => orderRepository.deleteOrder(orderId)),
  );
}

async function createOrder({
  learnerToken,
  tutories,
  sessionTime,
  totalHours,
}: {
  learnerToken: string;
  tutories: Partial<Tutories>;
  sessionTime: string;
  totalHours?: number;
}) {
  const orderRes = await supertest(app)
    .post("/api/v1/orders")
    .set("Authorization", `Bearer ${learnerToken}`)
    .send({
      tutoriesId: tutories.id,
      typeLesson:
        tutories.typeLesson === "both" ? "online" : tutories.typeLesson,
      sessionTime,
      totalHours: totalHours || 1,
      notes: "I want to learn more",
    })
    .expect(201);

  return { orderId: orderRes.body.data.orderId as string };
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

async function registerAndLoginUser(role: "learner" | "tutor") {
  const newUser = generateUser(role);
  const res = await supertest(app)
    .post("/api/v1/auth/register")
    .send(newUser)
    .expect(201);

  const userId = res.body.data.userId;
  expect(userId).toBeDefined();

  const loginRes = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email: newUser.email, password: newUser.password })
    .expect(200);

  const token = loginRes.body.data.token;
  expect(token).toBeDefined();

  return { user: newUser, token };
}

describe("Order a tutories", async () => {
  const { token } = await registerAndLoginUser("learner");

  const { randomTutories, availability } = await getRandomTutories();

  const createdOrders: string[] = [];
  afterAll(async () => await cleanupOrders(createdOrders));

  test("Learner can order a tutories", async () => {
    const { orderId } = await createOrder({
      learnerToken: token,
      tutories: randomTutories,
      sessionTime: availability[0],
    });

    expect(orderId).toBeDefined();
    createdOrders.push(orderId);
  });

  test("Learner cannot order a tutories with invalid session time", async () => {
    const res = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tutoriesId: randomTutories.id,
        typeLesson: "online",
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

describe("Accept an order", async () => {
  const createdOrders: string[] = [];
  afterAll(async () => await cleanupOrders(createdOrders));

  test("Tutor can accept an order", async () => {
    const { randomTutories, availability } = await getRandomTutories();

    const { token: learnerToken } = await registerAndLoginUser("learner");
    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    const { orderId } = await createOrder({
      learnerToken,
      tutories: randomTutories,
      sessionTime: availability[0],
    });

    expect(orderId).toBeDefined();
    createdOrders.push(orderId);

    // Accept the order
    await supertest(app)
      .post(`/api/v1/orders/${orderId}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);
  });

  test("Other tutor cannot accept the order", async () => {
    const { randomTutories, availability } = await getRandomTutories();

    const { token: learnerToken } = await registerAndLoginUser("learner");

    const { orderId } = await createOrder({
      learnerToken,
      tutories: randomTutories,
      sessionTime: availability[0],
    });
    expect(orderId).toBeDefined();
    createdOrders.push(orderId);

    const { token: tutorToken } = await registerAndLoginUser("tutor");
    await supertest(app)
      .post(`/api/v1/orders/${orderId}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(403);
  });
});

describe("Decline an order", async () => {
  const { token: learnerToken } = await registerAndLoginUser("learner");

  const createdOrders: string[] = [];
  afterAll(async () => await cleanupOrders(createdOrders));

  test("Tutor can decline an order", async () => {
    const { randomTutories, availability } = await getRandomTutories();

    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    const { orderId } = await createOrder({
      learnerToken,
      tutories: randomTutories,
      sessionTime: availability[0],
    });
    expect(orderId).toBeDefined();
    createdOrders.push(orderId);

    await supertest(app)
      .post(`/api/v1/orders/${orderId}/decline`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);
  });

  test("Learner cannot decline an order", async () => {
    await supertest(app)
      .post(`/api/v1/orders/x/decline`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(403);
  });

  test("Other tutor cannot decline the order", async () => {
    const { randomTutories, availability } = await getRandomTutories();
    // Create an order
    const { orderId } = await createOrder({
      learnerToken,
      tutories: randomTutories,
      sessionTime: availability[0],
    });
    expect(orderId).toBeDefined();
    createdOrders.push(orderId);

    const { token: tutorToken } = await registerAndLoginUser("tutor");
    await supertest(app)
      .post(`/api/v1/orders/${orderId}/decline`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(403);
  });
});

describe("Handle availability edge cases", async () => {
  const createdOrders: string[] = [];
  afterEach(async () => await cleanupOrders(createdOrders));

  test("Learner cannot order a tutories when there is already a scheduled order", async () => {
    const { randomTutories, availability } = await getRandomTutories();
    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    // User 1 order a tutories
    const { token: learnerToken } = await registerAndLoginUser("learner");
    const { orderId: orderId1 } = await createOrder({
      learnerToken,
      tutories: randomTutories,
      sessionTime: availability[0],
    });
    expect(orderId1).toBeDefined();
    createdOrders.push(orderId1);

    // User 2 order a tutories
    const { token: learnerToken2 } = await registerAndLoginUser("learner");
    const { orderId: orderId2 } = await createOrder({
      learnerToken: learnerToken2,
      tutories: randomTutories,
      sessionTime: availability[0],
      totalHours: 5,
    });
    expect(orderId2).toBeDefined();
    createdOrders.push(orderId2);

    // Tutor instead accepted the order from user 2 (Tutor wants to accept the order with more hours)
    await supertest(app)
      .post(`/api/v1/orders/${orderId2}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);

    // User 3 tries to order a tutories
    // User 3 should not be able to order a tutories because there is already a scheduled order
    const { token: learnerToken3 } = await registerAndLoginUser("learner");
    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken3}`)
      .send({
        tutoriesId: randomTutories.id,
        typeLesson: "online",
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(400);

    // The other one is expected to be declined
    const orders = await tutoriesRepository.getOrders(randomTutories.id);
    const order = orders.find((o) => o.id === orderId1);

    expect(order).toBeDefined();
    expect(order!.status).toBe("declined");
  });

  test("Tutor cannot accept an order when there is already a scheduled order", async () => {
    const { randomTutories, availability } = await getRandomTutories();
    const tutorToken = await loginAsTutor(randomTutories.tutorName);

    // Ensure there is available time slot
    expect(availability.length).toBeGreaterThan(0);

    const { token: learnerToken } = await registerAndLoginUser("learner");

    // Create first order
    const { orderId } = await createOrder({
      learnerToken,
      tutories: randomTutories,
      sessionTime: availability[0],
    });
    expect(orderId).toBeDefined();
    createdOrders.push(orderId);

    // Accept the order
    await supertest(app)
      .post(`/api/v1/orders/${orderId}/accept`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .expect(200);

    // Get availability after accepting the order
    const availabilityAfter = await tutorRepository.getAvailability(
      randomTutories.tutorId,
    );

    expect(availabilityAfter).not.toContain(availability[0]);

    // Trying to create another order for the same time slot should fail
    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({
        tutoriesId: randomTutories.id,
        typeLesson: "online",
        sessionTime: availability[0],
        totalHours: 1,
        notes: "This should fail",
      })
      .expect(400);
  });
});
