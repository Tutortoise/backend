import { firestore } from "@/config";
import { app } from "@/main";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { faker } from "@faker-js/faker";
import { login } from "@tests/helpers/client.helper";
import supertest from "supertest";
import { afterAll, describe, expect, test } from "vitest";

const tsService = new TutorServiceService({ firestore });

async function cleanupOrders() {
  const snapshot = await firestore.collection("orders").get();
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

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

describe("Order a service", async () => {
  const { idToken, userId } = await registerLearner();

  const services = await tsService.getTutorServices();

  afterAll(async () => {
    await cleanupOrders();
  });

  test("Learner can order a service", async () => {
    const availability = await tsService.getTutorServiceAvailability(
      services[0].id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        learnerId: userId,
        tutorServiceId: services[0].id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);
  });

  test("Learner cannot order a service with invalid session time", async () => {
    const res = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        learnerId: userId,
        tutorServiceId: services[0].id,
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
  const services = await tsService.getTutorServices();
  const randomService = faker.helpers.arrayElement(services);

  const { userId, idToken: learnerIdToken } = await registerLearner();

  afterAll(async () => {
    await cleanupOrders();
  });

  test("Tutor can cancel an order", async () => {
    const tutorId = await firestore
      .collection("tutor_services")
      .doc(randomService.id)
      .get()
      .then(async (doc) => {
        const ref = doc.data()?.tutorId;
        return ref.id;
      });
    const tutorIdToken = await login(tutorId);

    // Create an order
    const availability = await tsService.getTutorServiceAvailability(
      randomService.id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerIdToken}`)
      .send({
        learnerId: userId,
        tutorServiceId: randomService.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // Cancel the order
    const orders = await tsService.getOrders(randomService.id);
    const order = orders[0];
    await supertest(app)
      .post(`/api/v1/orders/${order.id}/cancel`)
      .set("Authorization", `Bearer ${tutorIdToken}`)
      .expect(200);
  });

  test("Learner cannot cancel an order", async () => {
    await supertest(app)
      .post(`/api/v1/orders/x/cancel`)
      .set("Authorization", `Bearer ${learnerIdToken}`)
      .expect(403);
  });
});

describe("Accept an order", async () => {
  test("Tutor can accept an order", async () => {
    const services = await tsService.getTutorServices();
    const randomService = faker.helpers.arrayElement(services);

    const { userId, idToken: learnerIdToken } = await registerLearner();

    const tutorId = await firestore
      .collection("tutor_services")
      .doc(randomService.id)
      .get()
      .then(async (doc) => {
        const ref = doc.data()?.tutorId;
        return ref.id;
      });
    const tutorIdToken = await login(tutorId);

    // Create an order
    const availability = await tsService.getTutorServiceAvailability(
      randomService.id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerIdToken}`)
      .send({
        learnerId: userId,
        tutorServiceId: randomService.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // Accept the order
    const orders = await tsService.getOrders(randomService.id);
    const order = orders[0];
    await supertest(app)
      .post(`/api/v1/orders/${order.id}/accept`)
      .set("Authorization", `Bearer ${tutorIdToken}`)
      .expect(200);
  });
});

describe("Decline an order", async () => {
  test("Tutor can decline an order", async () => {
    const services = await tsService.getTutorServices();
    const randomService = faker.helpers.arrayElement(services);

    const { userId, idToken: learnerIdToken } = await registerLearner();

    const tutorId = await firestore
      .collection("tutor_services")
      .doc(randomService.id)
      .get()
      .then(async (doc) => {
        const ref = doc.data()?.tutorId;
        return ref.id;
      });
    const tutorIdToken = await login(tutorId);

    // Create an order
    const availability = await tsService.getTutorServiceAvailability(
      randomService.id,
    );

    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${learnerIdToken}`)
      .send({
        learnerId: userId,
        tutorServiceId: randomService.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // Decline the order
    const orders = await tsService.getOrders(randomService.id);
    const order = orders[0];
    await supertest(app)
      .post(`/api/v1/orders/${order.id}/decline`)
      .set("Authorization", `Bearer ${tutorIdToken}`)
      .expect(200);
  });
});
