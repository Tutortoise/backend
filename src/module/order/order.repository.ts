import { db as dbType } from "@/db/config";
import {
  categories,
  learners,
  orders,
  reviews,
  tutories as tutoriesTable,
  tutors,
} from "@/db/schema";
import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";

export class OrderRepository {
  constructor(private readonly db: typeof dbType) {}

  async getOrderById(orderId: string) {
    const query = this.db
      .select()
      .from(orders)
      .innerJoin(tutoriesTable, eq(orders.tutoriesId, tutoriesTable.id))
      .innerJoin(tutors, eq(tutoriesTable.tutorId, tutors.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    return query;
  }

  async getOrders({
    learnerId,
    tutorId,
    tutoriesId,
    orderId,
    status,
    unreviewed,
  }: {
    learnerId?: string;
    tutorId?: string;
    tutoriesId?: string;
    orderId?: string;
    status?: "pending" | "scheduled" | "completed";
    unreviewed?: boolean;
  }) {
    await this.updateStatusToCompleted();

    const conditions = [];

    if (status === "pending") {
      conditions.push(eq(orders.status, "pending"));
    } else if (status === "scheduled") {
      conditions.push(eq(orders.status, "scheduled"));
    } else if (status === "completed") {
      conditions.push(inArray(orders.status, ["completed", "declined"]));
    }

    if (learnerId) {
      conditions.push(eq(orders.learnerId, learnerId));
    }

    if (orderId) {
      conditions.push(eq(orders.id, orderId));
    }

    if (typeof unreviewed === "boolean" && unreviewed) {
      conditions.push(
        and(isNull(orders.reviewDismissedAt), isNull(reviews.id)),
      );
    }

    if (tutorId) {
      const tutories = await this.db
        .select({ id: tutoriesTable.id })
        .from(orders)
        .innerJoin(tutoriesTable, eq(orders.tutoriesId, tutoriesTable.id))
        .where(eq(tutoriesTable.tutorId, tutorId));

      const tutoriesIds = tutories.map((t) => t.id);
      conditions.push(inArray(orders.tutoriesId, tutoriesIds));
    } else if (tutoriesId) {
      conditions.push(eq(orders.tutoriesId, tutoriesId));
    }

    const query = this.db
      .select({
        id: orders.id,
        status: orders.status,
        sessionTime: orders.sessionTime,
        estimatedEndTime: orders.estimatedEndTime,
        categoryName: categories.name,
        tutorId: tutoriesTable.tutorId,
        tutorName: tutors.name,
        learnerId: orders.learnerId,
        learnerName: learners.name,
        typeLesson: orders.typeLesson,
        price: orders.price,
        notes: orders.notes,
      })
      .from(orders)
      .innerJoin(tutoriesTable, eq(orders.tutoriesId, tutoriesTable.id))
      .innerJoin(tutors, eq(tutoriesTable.tutorId, tutors.id))
      .innerJoin(learners, eq(orders.learnerId, learners.id))
      .innerJoin(categories, eq(tutoriesTable.categoryId, categories.id))
      .leftJoin(reviews, eq(orders.id, reviews.orderId))
      .orderBy(desc(orders.updatedAt), desc(orders.createdAt))
      .where(and(...conditions));

    return query;
  }

  async createOrder(data: typeof orders.$inferInsert) {
    return this.db.insert(orders).values(data).returning();
  }

  async updateOrder(
    orderId: string,
    updates: Partial<typeof orders.$inferInsert>,
  ) {
    return this.db.update(orders).set(updates).where(eq(orders.id, orderId));
  }

  // Used for testing
  async deleteOrder(orderId: string) {
    return this.db.delete(orders).where(eq(orders.id, orderId)).execute();
  }

  async checkOrderExists(orderId: string) {
    const result = await this.db
      .select({ exists: eq(orders.id, orderId) })
      .from(orders)
      .limit(1);
    return result.length > 0;
  }

  async updateStatusToCompleted() {
    await this.db
      .update(orders)
      .set({ status: "completed" })
      .where(lte(orders.estimatedEndTime, new Date()));
  }
}
