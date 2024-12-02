import { db as dbType } from "@/db/config";
import { orders, categories, tutories, tutors } from "@/db/schema";
import {
  createTutoriesSchema,
  updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { DayIndex, GetTutoriesFilters } from "@/types";
import { and, avg, eq, gte, ilike, like, lte, not, or } from "drizzle-orm";
import { z } from "zod";

export class TutoriesRepository {
  constructor(private readonly db: typeof dbType) {}

  async getTutories(filters: GetTutoriesFilters = {}) {
    const conditions = [];

    if (filters.categoryId) {
      conditions.push(eq(tutories.categoryId, filters.categoryId));
    }

    if (filters.tutorId) {
      conditions.push(eq(tutories.tutorId, filters.tutorId));
    }

    if (
      typeof filters.minHourlyRate !== "undefined" &&
      filters.minHourlyRate !== null
    ) {
      conditions.push(gte(tutories.hourlyRate, filters.minHourlyRate));
    }

    if (
      typeof filters.maxHourlyRate !== "undefined" &&
      filters.maxHourlyRate !== null
    ) {
      conditions.push(lte(tutories.hourlyRate, filters.maxHourlyRate));
    }

    if (filters.typeLesson) {
      conditions.push(eq(tutories.typeLesson, filters.typeLesson));
    }

    if (filters.city) {
      conditions.push(like(tutors.city, `%${filters.city}%`));
    }

    if (filters.q) {
      conditions.push(
        or(
          ilike(tutors.name, `%${filters.q}%`),
          ilike(categories.name, `%${filters.q}%`),
        ),
      );
    }

    if (typeof filters.isEnabled === "boolean") {
      conditions.push(eq(tutories.isEnabled, filters.isEnabled));
    }

    return await this.db
      .select({
        id: tutories.id,
        name: tutories.name,
        tutorId: tutors.id,
        tutorName: tutors.name,
        categoryName: categories.name,
        hourlyRate: tutories.hourlyRate,
        typeLesson: tutories.typeLesson,
        city: tutors.city,
        district: tutors.district,
      })
      .from(tutories)
      .where(and(...conditions))
      .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
      .innerJoin(categories, eq(tutories.categoryId, categories.id))
      .execute();
  }

  async getTutoriesDetail(tutoriesId: string) {
    const [t] = await this.db
      .select({
        id: tutories.id,
        name: tutories.name,
        tutorId: tutors.id,
        categoryName: categories.name,
        tutorName: tutors.name,
        aboutYou: tutories.aboutYou,
        teachingMethodology: tutories.teachingMethodology,
        hourlyRate: tutories.hourlyRate,
        typeLesson: tutories.typeLesson,
        city: tutors.city,
        district: tutors.district,
        isEnabled: tutories.isEnabled,
      })
      .from(tutories)
      .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
      .innerJoin(categories, eq(tutories.categoryId, categories.id))
      .where(eq(tutories.id, tutoriesId))
      .limit(1);

    if (!t) {
      return null;
    }

    const alsoTeaches = await this.db
      .select({
        id: tutories.id,
        categoryName: categories.name,
        hourlyRate: tutories.hourlyRate,
        typeLesson: tutories.typeLesson,
      })
      .from(tutories)
      .innerJoin(categories, eq(tutories.categoryId, categories.id))
      .where(
        and(
          eq(tutories.tutorId, t.tutorId),
          not(eq(tutories.id, tutoriesId)),
          eq(tutories.isEnabled, true),
        ),
      );

    return {
      ...t,
      alsoTeaches,
    };
  }

  async getTutoriesAvailability(tutoriesId: string) {
    const [t] = await this.db
      .select({
        availability: tutors.availability,
        tutorId: tutories.tutorId,
      })
      .from(tutories)
      .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
      .where(eq(tutories.id, tutoriesId))
      .limit(1);

    if (!t) {
      throw new Error("Tutories not found");
    }

    const today = new Date();
    const next2WeeksAvailability: string[] = [];

    const existingOrders = await this.getOrdersByTutor(t.tutorId);
    const existingOrderTimes = existingOrders
      .filter((order) => order.status === "scheduled")
      .map((order) => ({
        startTime: order.sessionTime,
        endTime: new Date(order.sessionTime).setHours(
          new Date(order.sessionTime).getHours() + order.totalHours,
        ),
      }));

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayIndex = date.getUTCDay() as DayIndex;
      const times = t.availability?.[dayIndex] || [];

      times.forEach((time: string) => {
        const [hours, minutes] = time.split(":").map(Number);

        const datetime = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            hours,
            minutes,
          ),
        );

        // Skip past times
        if (datetime < today) {
          return;
        }

        // Skip times that are already booked
        for (const { startTime, endTime } of existingOrderTimes) {
          if (datetime >= new Date(startTime) && datetime < new Date(endTime)) {
            return;
          }
        }

        next2WeeksAvailability.push(datetime.toISOString());
      });
    }

    return next2WeeksAvailability;
  }

  async getAverageHourlyRate({
    categoryId,
    city,
    district,
  }: {
    categoryId: string;
    city?: string;
    district?: string;
  }) {
    let locationCondition;
    if (city) {
      locationCondition = eq(tutors.city, city);
    } else if (district) {
      locationCondition = eq(tutors.district, district);
    }

    const [result] = await this.db
      .select({
        avgHourlyRate: avg(tutories.hourlyRate),
      })
      .from(tutories)
      .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
      .where(and(eq(tutories.categoryId, categoryId), locationCondition));

    return parseFloat(result.avgHourlyRate ?? "0");
  }

  async createTutories(
    tutorId: string,
    data: z.infer<typeof createTutoriesSchema>["body"],
  ) {
    return await this.db
      .insert(tutories)
      .values({ ...data, tutorId })
      .returning({ id: tutories.id });
  }

  async updateTutories(
    tutoriesId: string,
    data: z.infer<typeof updateTutoriesSchema>["body"],
  ) {
    await this.db
      .update(tutories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tutories.id, tutoriesId));
  }

  async deleteTutories(tutoriesId: string) {
    await this.db.delete(tutories).where(eq(tutories.id, tutoriesId));
  }

  async getOrders(tutoriesId: string) {
    return await this.db
      .select({
        id: orders.id,
        tutoriesId: orders.tutoriesId,
        sessionTime: orders.sessionTime,
        totalHours: orders.totalHours,
        notes: orders.notes,
        learnerId: orders.learnerId,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.tutoriesId, tutoriesId));
  }

  async getOrdersByTutor(tutorId: string) {
    try {
      return await this.db
        .select({
          id: orders.id,
          tutoriesId: orders.tutoriesId,
          sessionTime: orders.sessionTime,
          totalHours: orders.totalHours,
          notes: orders.notes,
          learnerId: orders.learnerId,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .innerJoin(tutories, eq(orders.tutoriesId, tutories.id))
        .where(eq(tutories.tutorId, tutorId));
    } catch (error) {
      throw new Error(`Failed to get orders by tutor: ${error}`);
    }
  }

  async validateTutoriesOwnership(tutorId: string, tutoriesId: string) {
    try {
      const [t] = await this.db
        .select({
          id: tutories.id,
        })
        .from(tutories)
        .where(and(eq(tutories.id, tutoriesId), eq(tutories.tutorId, tutorId)))
        .limit(1);

      return !!t;
    } catch (error) {
      throw new Error(`Error validating tutories ownership: ${error}`);
    }
  }

  async checkTutoriesExists(tutoriesId: string) {
    try {
      const [t] = await this.db
        .select({
          id: tutories.id,
        })
        .from(tutories)
        .where(eq(tutories.id, tutoriesId))
        .limit(1);

      return !!t;
    } catch (error) {
      throw new Error(`Error checking if tutories exists: ${error}`);
    }
  }
}
