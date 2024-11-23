import { tutors, tutories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm/expressions";
import { db as dbType } from "@/db/config";

export class TutorRepository {
  constructor(private readonly db: typeof dbType) {}

  public async updateTutorProfile(userId: string, data: any) {
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
    const result = await this.db
      .select({ id: tutors.id })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);

    return result.length > 0;
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

  public async getTutorById(tutorId: string) {
    const result = await this.db
      .select()
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);

    return result[0];
  }
}
