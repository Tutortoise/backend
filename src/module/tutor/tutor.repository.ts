import { db as dbType } from "@/db/config";
import { tutories, tutors } from "@/db/schema";
import { Tutor } from "@/types";
import { eq, inArray, isNotNull } from "drizzle-orm/expressions";

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

  public async getLocations() {
    const [cities, districts] = await Promise.all([
      this.db
        .selectDistinct({ city: tutors.city })
        .from(tutors)
        .where(isNotNull(tutors.city)),
      this.db
        .selectDistinct({ district: tutors.district })
        .from(tutors)
        .where(isNotNull(tutors.district)),
    ]);

    return {
      cities: cities.map((c) => c.city),
      districts: districts.map((d) => d.district),
    };
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
        availability: tutors.availability,
        createdAt: tutors.createdAt,
      })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);

    return result[0];
  }

  public async isProfileComplete(tutorId: string) {
    const [tutor] = await this.db
      .select({
        id: tutors.id,
        name: tutors.name,
        email: tutors.email,
        gender: tutors.gender,
        city: tutors.city,
        district: tutors.district,
      })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);

    return (
      tutor &&
      tutor.name &&
      tutor.email &&
      tutor.gender &&
      tutor.city &&
      tutor.district
    );
  }
}
