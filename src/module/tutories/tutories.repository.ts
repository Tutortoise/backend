import { db as dbType } from "@/db/config";
import {
  orders,
  subjects,
  TutorAvailability,
  tutories,
  tutors,
} from "@/db/schema";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@/module/tutories/tutories.schema";
import { and, eq, gte, like, lte, not, or } from "drizzle-orm";
import { z } from "zod";

type GetTutoriesFilters = {
  q?: string | null;
  subjectId?: string | null;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  typeLesson?: "online" | "offline" | "both" | null;
  tutorId?: string | null;
  city?: string | null;
};

export class TutoriesRepository {
  constructor(private readonly db: typeof dbType) {}

  async getTutories(
    filters: GetTutoriesFilters = {
      q: null,
      subjectId: null,
      minHourlyRate: null,
      maxHourlyRate: null,
      typeLesson: null,
      tutorId: null,
      city: null,
    },
  ) {
    try {
      const conditions = [];

      if (filters.subjectId) {
        conditions.push(eq(tutories.subjectId, filters.subjectId));
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
            like(tutors.name, `%${filters.q}%`),
            like(subjects.name, `%${filters.q}%`),
          ),
        );
      }

      return await this.db
        .select({
          id: tutories.id,
          tutorName: tutors.name,
          subjectName: subjects.name,
          hourlyRate: tutories.hourlyRate,
          typeLesson: tutories.typeLesson,
        })
        .from(tutories)
        .where(and(...conditions))
        .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
        .innerJoin(subjects, eq(tutories.subjectId, subjects.id))
        .execute();
    } catch (error) {
      throw new Error(`Failed to get tutories: ${error}`);
    }
  }

  async getTutoriesDetail(tutoriesId: string) {
    try {
      const [service] = await this.db
        .select()
        .from(tutories)
        .innerJoin(tutors, eq(tutories.tutorId, tutors.id))
        .innerJoin(subjects, eq(tutories.subjectId, subjects.id))
        .where(eq(tutories.id, tutoriesId))
        .limit(1);

      if (!service) {
        return null;
      }

      const alsoTeaches = await this.db
        .select({
          subjectName: subjects.name,
          hourlyRate: tutories.hourlyRate,
          typeLesson: tutories.typeLesson,
        })
        .from(tutories)
        .innerJoin(subjects, eq(tutories.subjectId, subjects.id))
        .where(
          and(
            eq(tutories.tutorId, service.tutors.id),
            not(eq(tutories.id, tutoriesId)),
          ),
        );

      return {
        ...service,
        alsoTeaches,
      };
    } catch (error) {
      throw new Error(`Failed to get tutories detail: ${error}`);
    }
  }

  async getTutoriesAvailability(serviceId: string) {
    try {
      const [service] = await this.db
        .select({
          availability: tutories.availability,
          tutorId: tutories.tutorId,
        })
        .from(tutories)
        .where(eq(tutories.id, serviceId))
        .limit(1);

      if (!service) {
        throw new Error("Tutor service not found");
      }

      const today = new Date();
      const next7DaysAvailability: string[] = [];

      const existingOrders = await this.getOrdersByTutor(service.tutorId);
      const existingOrderTimes = existingOrders
        .filter((order) => order.status === "scheduled")
        .map((order) => ({
          startTime: order.sessionTime,
          endTime: new Date(order.sessionTime).setHours(
            new Date(order.sessionTime).getHours() + order.totalHours,
          ),
        }));

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayIndex = date.getUTCDay();
        const times = service.availability?.[dayIndex] || [];

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
            if (
              datetime >= new Date(startTime) &&
              datetime < new Date(endTime)
            ) {
              return;
            }
          }

          next7DaysAvailability.push(datetime.toISOString());
        });
      }

      return next7DaysAvailability;
    } catch (error) {
      throw new Error(`Failed to get tutor service availability: ${error}`);
    }
  }

  async createTutories(
    tutorId: string,
    data: z.infer<typeof createTutorServiceSchema>["body"],
  ) {
    const {
      subjectId,
      aboutYou,
      teachingMethodology,
      hourlyRate,
      typeLesson,
      availability,
    } = data;

    try {
      await this.db.insert(tutories).values({
        tutorId,
        subjectId,
        aboutYou,
        teachingMethodology,
        hourlyRate,
        typeLesson,
        availability: availability as TutorAvailability,
      });
    } catch (error) {
      throw new Error(`Failed to create tutor service: ${error}`);
    }
  }

  async updateTutories(
    serviceId: string,
    data: z.infer<typeof updateTutorServiceSchema>["body"],
  ) {
    try {
      await this.db
        .update(tutories)
        .set({
          ...data,
          availability: data.availability as TutorAvailability,
          updatedAt: new Date(),
        })
        .where(eq(tutories.id, serviceId));
    } catch (error) {
      throw new Error(`Failed to update tutories: ${error}`);
    }
  }

  async deleteTutories(serviceId: string) {
    try {
      await this.db.delete(tutories).where(eq(tutories.id, serviceId));
    } catch (error) {
      throw new Error(`Failed to delete tutories: ${error}`);
    }
  }

  async getOrders(serviceId: string) {
    try {
      return await this.db
        .select({
          id: orders.id,
          tutoryId: orders.tutoryId,
          sessionTime: orders.sessionTime,
          totalHours: orders.totalHours,
          notes: orders.notes,
          learnerId: orders.learnerId,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.tutoryId, serviceId));
    } catch (error) {
      throw new Error(`Failed to get orders: ${error}`);
    }
  }

  async getOrdersByTutor(tutorId: string) {
    try {
      return await this.db
        .select({
          id: orders.id,
          tutoryId: orders.tutoryId,
          sessionTime: orders.sessionTime,
          totalHours: orders.totalHours,
          notes: orders.notes,
          learnerId: orders.learnerId,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.tutorId, tutorId));
    } catch (error) {
      throw new Error(`Failed to get orders by tutor: ${error}`);
    }
  }

  async validateTutoriesOwnership(tutorId: string, serviceId: string) {
    try {
      const [service] = await this.db
        .select({
          id: tutories.id,
        })
        .from(tutories)
        .where(and(eq(tutories.id, serviceId), eq(tutories.tutorId, tutorId)))
        .limit(1);

      return !!service;
    } catch (error) {
      throw new Error(`Error validating tutor service ownership: ${error}`);
    }
  }

  async checkTutoriesExists(serviceId: string) {
    try {
      const [service] = await this.db
        .select({
          id: tutories.id,
        })
        .from(tutories)
        .where(eq(tutories.id, serviceId))
        .limit(1);

      return !!service;
    } catch (error) {
      throw new Error(`Error checking if tutor service exists: ${error}`);
    }
  }
}