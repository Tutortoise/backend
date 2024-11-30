import { tutors, tutories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm/expressions";
import { db as dbType } from "@/db/config";
import { Tutor } from "@/types";

export class TutorRepository {
  constructor(private readonly db: typeof dbType) {}

  public async updateTutor(userId: string, data: Partial<Tutor>) {
    await this.db
      .update(tutors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tutors.id, userId));
  }

  public async getAllTutors() {
    return await this.db.select().from(tutors);
  }

  public async hasTutors() {
    const result = await this.db.select().from(tutors);
    return result.length > 0;
  }

  // Check if a tutor exists
  public async checkTutorExists(tutorId: string) {
    try {
      const result = await this.db
        .select({ id: tutors.id })
        .from(tutors)
        .where(eq(tutors.id, tutorId))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  public async validateServices(services: string[]) {
    try {
      const result = await this.db
        .select({ id: tutories.id })
        .from(tutories)
        .where(inArray(tutories.id, services));

      return result.length === services.length;
    } catch (error) {
      return false;
    }
  }

  public async getPassword(tutorId: string) {
    const result = await this.db
      .select({ password: tutors.password })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);

    return result[0];
  }

  public async getTutorById(tutorId: string) {
    const result = await this.db
      .select({
        id: tutors.id,
        name: tutors.name,
        email: tutors.email,
        gender: tutors.gender,
        phoneNumber: tutors.phoneNumber,
        city: tutors.city,
        district: tutors.district,
        createdAt: tutors.createdAt,
      })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);

    return result[0];
  }
}
