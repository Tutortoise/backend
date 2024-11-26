import type { db as dbType } from "@/db/config";
import { interests, learners, subjects } from "@/db/schema";
import { eq } from "drizzle-orm/expressions";

export class LearnerRepository {
  constructor(private readonly db: typeof dbType) {}

  // Update learner profile
  public async updateLearnerProfile(userId: string, data: any) {
    if (data.interests) {
      await this.db.delete(interests).where(eq(interests.learnerId, userId));
      await this.db.insert(interests).values(
        data.interests.map((subjectId: string) => ({
          learnerId: userId,
          subjectId: subjectId,
        })),
      );
    }

    await this.db
      .update(learners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(learners.id, userId));
  }

  // Check if a learner exists
  public async checkLearnerExists(learnerId: string) {
    const result = await this.db
      .select({ id: learners.id })
      .from(learners)
      .where(eq(learners.id, learnerId))
      .limit(1);

    return result.length > 0;
  }

  // Fetch valid subjects for validation
  public async getValidSubjects() {
    const results = await this.db.select({ id: subjects.id }).from(subjects);

    return results.map((subject) => subject.id);
  }

  public async getPassword(learnerId: string) {
    const result = await this.db
      .select({ password: learners.password })
      .from(learners)
      .where(eq(learners.id, learnerId))
      .limit(1);

    return result[0];
  }

  public async getLearnerById(learnerId: string) {
    const result = await this.db
      .select({
        id: learners.id,
        name: learners.name,
        email: learners.email,
        learningStyle: learners.learningStyle,
        gender: learners.gender,
        phoneNumber: learners.phoneNumber,
        city: learners.city,
        district: learners.district,
        createdAt: learners.createdAt,
      })
      .from(learners)
      .where(eq(learners.id, learnerId))
      .limit(1);

    return result[0];
  }
}
