import { db as dbType } from "@/db/config";
import { orders, tutories as tutoriesTable, tutors } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

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
  }: {
    learnerId?: string;
    tutorId?: string;
    tutoriesId?: string;
    orderId?: string;
    status?: "pending" | "scheduled" | "completed";
  }) {
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
        tutorId: tutoriesTable.tutorId,
        tutorName: tutors.name,
      })
      .from(orders)
      .innerJoin(tutoriesTable, eq(orders.tutoriesId, tutoriesTable.id))
      .innerJoin(tutors, eq(tutoriesTable.tutorId, tutors.id))
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
  async deleteAllOrders() {
    return this.db.delete(orders).execute();
  }

  async checkOrderExists(orderId: string) {
    const result = await this.db
      .select({ exists: eq(orders.id, orderId) })
      .from(orders)
      .limit(1);
    return result.length > 0;
  }
}
