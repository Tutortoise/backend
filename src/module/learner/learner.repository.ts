import type { db as dbType } from "@/db/config";
import { learners, subjects } from "@/db/schema";
import { eq } from "drizzle-orm/expressions";

export class LearnerRepository {
  constructor(private readonly db: typeof dbType) {}

  // Update learner profile
  public async updateLearnerProfile(userId: string, data: any) {
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
}
