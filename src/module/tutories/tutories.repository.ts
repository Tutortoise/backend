import { db as dbType } from "@/db/config";
import { categories, orders, tutories, tutors } from "@/db/schema";
import {
  createTutoriesSchema,
  updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { GetTutoriesFilters } from "@/types";
import {
  and,
  avg,
  count,
  countDistinct,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  not,
  or,
} from "drizzle-orm";
import { z } from "zod";

export class TutoriesRepository {
  constructor(private readonly db: typeof dbType) {}

  async getTutories(filters: GetTutoriesFilters = {}) {
    const conditions = [];

    if (filters.categoryId) {
      if (Array.isArray(filters.categoryId)) {
        conditions.push(inArray(tutories.categoryId, filters.categoryId));
      } else {
        conditions.push(eq(tutories.categoryId, filters.categoryId));
      }
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
      if (Array.isArray(filters.city)) {
        conditions.push(inArray(tutors.city, filters.city));
      } else {
        conditions.push(eq(tutors.city, filters.city));
      }
    }

    if (filters.q) {
      conditions.push(
        or(
          ilike(tutories.name, `%${filters.q}%`),
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
      .where(and(...conditions, isNotNull(tutors.availability)))
      .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
      .innerJoin(categories, eq(tutories.categoryId, categories.id))
      .execute();
  }

  async getTutoriesById(tutoriesId: string) {
    const [t] = await this.db
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
      .where(eq(tutories.id, tutoriesId))
      .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
      .innerJoin(categories, eq(tutories.categoryId, categories.id))
      .limit(1);

    return t;
  }

  async getTutoriesDetail(tutoriesId: string) {
    const { tutorId } = await this.db
      .select({ tutorId: tutories.tutorId })
      .from(tutories)
      .where(eq(tutories.id, tutoriesId))
      .limit(1)
      .then(([result]) => result);

    // Execute the rest of the queries in parallel
    const [[t], [orderStats], alsoTeaches] = await Promise.all([
      // Get tutories detail
      this.db
        .select({
          id: tutories.id,
          name: tutories.name,
          tutorId: tutors.id,
          categoryName: categories.name,
          categoryId: tutories.categoryId,
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
        .limit(1),

      // Get total orders and learners (unique)
      this.db
        .select({
          totalOrders: count(orders.id),
          totalLearners: countDistinct(orders.learnerId),
        })
        .from(orders)
        .where(
          and(
            eq(orders.tutoriesId, tutoriesId),
            eq(orders.status, "completed"),
          ),
        )
        .limit(1),

      // Get also teaches
      this.db
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
            eq(tutories.tutorId, tutorId),
            not(eq(tutories.id, tutoriesId)),
            eq(tutories.isEnabled, true),
          ),
        ),
    ]);

    return {
      ...t,
      alsoTeaches,
      totalOrders: orderStats.totalOrders,
      totalLearners: orderStats.totalLearners,
    };
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
