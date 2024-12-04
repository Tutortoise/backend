import { db as dbType } from "@/db/config";
import { reviews, orders, learners, tutories } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";

export class ReviewRepository {
  constructor(private readonly db: typeof dbType) {}

  async createReview(data: {
    orderId: string;
    rating: number;
    message?: string;
  }) {
    const [review] = await this.db
      .insert(reviews)
      .values({
        orderId: data.orderId,
        rating: data.rating,
        message: data.message,
      })
      .returning();

    return review;
  }

  async getTutoriesReviews(tutoriesId: string) {
    return this.db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        message: reviews.message,
        createdAt: reviews.createdAt,
        learnerId: learners.id,
        learnerName: learners.name,
      })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .innerJoin(learners, eq(orders.learnerId, learners.id))
      .where(eq(orders.tutoriesId, tutoriesId))
      .orderBy(desc(reviews.createdAt));
  }

  async hasReview(orderId: string) {
    const [review] = await this.db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.orderId, orderId))
      .limit(1);

    return !!review;
  }

  async getAverageRating(tutoriesId: string) {
    const result = await this.db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})::numeric(10,1)::float`,
        totalReviews: sql<number>`COUNT(${reviews.id})::int`,
      })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .where(eq(orders.tutoriesId, tutoriesId))
      .groupBy(orders.tutoriesId)
      .limit(1);

    return result[0] || { avgRating: 0, totalReviews: 0 };
  }

  async getBatchAverageRatings(tutoriesIds: string[]) {
    const results = await this.db
      .select({
        tutoriesId: orders.tutoriesId,
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating})::numeric(10,1), 0)`,
        totalReviews: sql<number>`COUNT(${reviews.id})::int`,
      })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .where(inArray(orders.tutoriesId, tutoriesIds))
      .groupBy(orders.tutoriesId);

    return results;
  }
}
