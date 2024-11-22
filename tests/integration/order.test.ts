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
  const { idToken } = await registerLearner();

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

  const { idToken: learnerIdToken } = await registerLearner();

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
  afterAll(async () => {
    await cleanupOrders();
  });

  test("Tutor can accept an order", async () => {
    const services = await tsService.getTutorServices();
    const randomService = faker.helpers.arrayElement(services);

    const { idToken: learnerIdToken } = await registerLearner();

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
  afterAll(async () => {
    await cleanupOrders();
  });

  test("Tutor can decline an order", async () => {
    const services = await tsService.getTutorServices();
    const randomService = faker.helpers.arrayElement(services);

    const { idToken: learnerIdToken } = await registerLearner();

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

describe("Handle availability edge cases", async () => {
  afterAll(async () => {
    await cleanupOrders();
  });

  test("Learner cannot order a service when there is already a scheduled order", async () => {
    const services = await tsService.getTutorServices();
    const randomService = faker.helpers.arrayElement(services);

    const tutorId = await firestore
      .collection("tutor_services")
      .doc(randomService.id)
      .get()
      .then(async (doc) => {
        const ref = doc.data()?.tutorId;
        return ref.id;
      });
    const tutorIdToken = await login(tutorId);

    const availability = await tsService.getTutorServiceAvailability(
      randomService.id,
    );

    // User 1 order a service
    const { idToken } = await registerLearner();
    const orderByUser1 = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        tutorServiceId: randomService.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(201);

    // User 2 order a service
    const { idToken: idToken2 } = await registerLearner();
    const orderByUser2 = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken2}`)
      .send({
        tutorServiceId: randomService.id,
        sessionTime: availability[0],
        totalHours: 5,
        notes: "I want to learn more",
      })
      .expect(201);

    // Tutor instead accepted the order from user 2 (Tutor wants to accept the order with more hours)
    await supertest(app)
      .post(`/api/v1/orders/${orderByUser2.body.data.orderId}/accept`)
      .set("Authorization", `Bearer ${tutorIdToken}`)
      .expect(200);

    // User 3 tries to order a service
    // User 3 should not be able to order a service because there is already a scheduled order
    const { idToken: idToken3 } = await registerLearner();
    await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken3}`)
      .send({
        tutorServiceId: randomService.id,
        sessionTime: availability[0],
        totalHours: 1,
        notes: "I want to learn more",
      })
      .expect(400);

    // The other one is expected to be declined
    const orders = await tsService.getOrders(randomService.id);
    const order = orders.find((o) => o.id === orderByUser1.body.data.orderId);

    expect(order).toBeDefined();
    expect(order!.status).toBe("canceled");
  });

  test("Tutor cannot accept an order when there is already a scheduled order", async () => {
    const services = await tsService.getTutorServices();
    const randomService = faker.helpers.arrayElement(services);

    const tutorId = await firestore
      .collection("tutor_services")
      .doc(randomService.id)
      .get()
      .then(async (doc) => {
        const ref = doc.data()?.tutorId;
        return ref.id;
      });
    const tutorIdToken = await login(tutorId);

    const availabilityBefore = await tsService.getTutorServiceAvailability(
      randomService.id,
    );

    // User 1 order a service
    const totalHours = 5;
    const { idToken } = await registerLearner();
    const orderByUser1 = await supertest(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        tutorServiceId: randomService.id,
        sessionTime: availabilityBefore[0],
        totalHours,
        notes: "I want to learn more",
      })
      .expect(201);

    // Accept the order
    await supertest(app)
      .post(`/api/v1/orders/${orderByUser1.body.data.orderId}/accept`)
      .set("Authorization", `Bearer ${tutorIdToken}`)
      .expect(200);

    // Make sure there is no conflicting for availabilityBefore[0]
    // Check it from availabilityAfter
    const availabilityAfter = await tsService.getTutorServiceAvailability(
      randomService.id,
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
