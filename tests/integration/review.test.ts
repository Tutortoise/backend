import { app } from "@/main";
import { container } from "@/container";
import { generateUser } from "@tests/helpers/generate.helper";
import { generateJWT } from "@/helpers/jwt.helper";
import supertest from "supertest";
import { describe, expect, test, beforeAll } from "vitest";
import { db } from "@/db/config";
import { reviews, orders } from "@/db/schema";
import type { UserRole } from "@/db/schema";
import { faker } from "@faker-js/faker";

const orderRepository = container.orderRepository;
const tutoriesRepository = container.tutoriesRepository;
const reviewRepository = container.reviewRepository;
const authRepository = container.authRepository;

interface TestUser {
  id: string;
  token: string;
  role: UserRole;
}

async function createTestUser(role: UserRole): Promise<TestUser> {
  const userData = generateUser(role);
  const { id } = await authRepository.registerUser({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role,
  });
  const token = generateJWT({ id, role });
  return { id, token, role };
}

async function createOrder(learnerId: string, tutoriesId: string) {
  const availability =
    await tutoriesRepository.getTutoriesAvailability(tutoriesId);
  const [order] = await orderRepository.createOrder({
    learnerId,
    tutoriesId,
    sessionTime: new Date(availability[0]),
    totalHours: 1,
    status: "completed",
  });
  return order;
}

describe("Review Module", () => {
  let learner: TestUser;
  let tutor: TestUser;
  let tutoriesId: string;
  let orderId: string;

  beforeAll(async () => {
    // Clean up existing data
    await db.delete(reviews);

    // Create test users
    learner = await createTestUser("learner");
    tutor = await createTestUser("tutor");

    // Get a tutories for testing
    const tutories = await tutoriesRepository.getTutories();
    tutoriesId = tutories[0].id;

    // Create a completed order
    const order = await createOrder(learner.id, tutoriesId);
    orderId = order.id;
  });

  describe("Create Review", () => {
    test("should create review for completed order", async () => {
      const reviewData = {
        rating: 5,
        message: "Great tutoring session!",
      };

      const res = await supertest(app)
        .post(`/api/v1/reviews/orders/${orderId}`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(reviewData)
        .expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.rating).toBe(reviewData.rating);
      expect(res.body.data.message).toBe(reviewData.message);
    });

    test("should not create duplicate review", async () => {
      const reviewData = {
        rating: 4,
        message: "Another review",
      };

      const res = await supertest(app)
        .post(`/api/v1/reviews/orders/${orderId}`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(reviewData)
        .expect(400);

      expect(res.body.status).toBe("fail");
      expect(res.body.message).toBe("You have already reviewed this order");
    });

    test("should not create review for non-completed order", async () => {
      // Create a pending order
      const pendingOrder = await createOrder(learner.id, tutoriesId);
      await orderRepository.updateOrder(pendingOrder.id, { status: "pending" });

      const reviewData = {
        rating: 5,
        message: "Should not work",
      };

      const res = await supertest(app)
        .post(`/api/v1/reviews/orders/${pendingOrder.id}`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(reviewData)
        .expect(400);

      expect(res.body.status).toBe("fail");
      expect(res.body.message).toBe("You can only review completed orders");
    });

    test("should validate review data", async () => {
      // Create another completed order
      const newOrder = await createOrder(learner.id, tutoriesId);

      const invalidReviewData = {
        rating: 6, // Invalid rating (should be 1-5)
        message: "x".repeat(501), // Too long message
      };

      const res = await supertest(app)
        .post(`/api/v1/reviews/orders/${newOrder.id}`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(invalidReviewData)
        .expect(400);

      expect(res.body.status).toBe("fail");
      expect(res.body.message).toBe("Validation error");
    });

    test("should not allow tutor to create review", async () => {
      const reviewData = {
        rating: 5,
        message: "Should not work",
      };

      const res = await supertest(app)
        .post(`/api/v1/reviews/orders/${orderId}`)
        .set("Authorization", `Bearer ${tutor.token}`)
        .send(reviewData)
        .expect(403);

      expect(res.body.status).toBe("fail");
    });
  });

  describe("Get Tutories Reviews", () => {
    test("should get all reviews for a tutories", async () => {
      const res = await supertest(app)
        .get(`/api/v1/reviews/tutories/${tutoriesId}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);

      const review = res.body.data[0];
      expect(review).toHaveProperty("id");
      expect(review).toHaveProperty("rating");
      expect(review).toHaveProperty("message");
      expect(review).toHaveProperty("createdAt");
      expect(review).toHaveProperty("learnerName");
    });

    test("should handle non-existent tutories", async () => {
      const fakeId = faker.string.uuid();
      const res = await supertest(app)
        .get(`/api/v1/reviews/tutories/${fakeId}`)
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data).toEqual([]);
    });
  });

  describe("Review Authorization", () => {
    test("should not allow review of other learner's order", async () => {
      const otherLearner = await createTestUser("learner");
      const order = await createOrder(learner.id, tutoriesId);

      const reviewData = {
        rating: 5,
        message: "Should not work",
      };

      const res = await supertest(app)
        .post(`/api/v1/reviews/orders/${order.id}`)
        .set("Authorization", `Bearer ${otherLearner.token}`)
        .send(reviewData)
        .expect(403);

      expect(res.body.status).toBe("fail");
      expect(res.body.message).toBe(
        "You can only review orders that you've made",
      );
    });

    test("should require authentication for creating review", async () => {
      const reviewData = {
        rating: 5,
        message: "Should not work",
      };

      await supertest(app)
        .post(`/api/v1/reviews/orders/${orderId}`)
        .send(reviewData)
        .expect(401);
    });
  });

  describe("Review Rating Validation", () => {
    test("should validate decimal ratings", async () => {
      const reviewData = {
        rating: 4.5, // Should be whole numbers
        message: "Invalid rating",
      };

      await supertest(app)
        .post(`/api/v1/reviews/orders/${orderId}`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(reviewData)
        .expect(400);
    });

    test("should validate negative ratings", async () => {
      const reviewData = {
        rating: -1,
        message: "Invalid rating",
      };

      await supertest(app)
        .post(`/api/v1/reviews/orders/${orderId}`)
        .set("Authorization", `Bearer ${learner.token}`)
        .send(reviewData)
        .expect(400);
    });
  });

  describe("Review Listing Features", () => {
    test("should return reviews in correct order", async () => {
      const res = await supertest(app)
        .get(`/api/v1/reviews/tutories/${tutoriesId}`)
        .expect(200);

      // Verify reviews are sorted by creation date
      const reviews = res.body.data;
      for (let i = 1; i < reviews.length; i++) {
        const prevDate = new Date(reviews[i - 1].createdAt);
        const currDate = new Date(reviews[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });
});
