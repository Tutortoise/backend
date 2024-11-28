import type { db as dbType } from "@/db/config";
import { subjects, tutories } from "@/db/schema";
import { and, desc, eq, inArray, notExists, sql } from "drizzle-orm";

export class SubjectRepository {
  constructor(private readonly db: typeof dbType) {}

  public async getAllSubjects() {
    const results = await this.db.select().from(subjects);
    return results.map((subject) => ({
      id: subject.id,
      name: subject.name,
      iconUrl: subject.iconUrl,
    }));
  }

  public async getPopularSubjects() {
    const results = await this.db
      .select({
        id: subjects.id,
        name: subjects.name,
        iconUrl: subjects.iconUrl,
        tutoriesCount: sql<number>`COUNT(${tutories.id})::int`,
      })
      .from(subjects)
      .leftJoin(tutories, eq(subjects.id, tutories.subjectId))
      .groupBy(subjects.id)
      .orderBy(desc(sql`COUNT(${tutories.id})`));

    return results.map((subject) => ({
      id: subject.id,
      name: subject.name,
      iconUrl: subject.iconUrl,
      tutoriesCount: subject.tutoriesCount,
    }));
  }

  public async getAvailableSubjects(tutorId: string) {
    const results = await this.db
      .select()
      .from(subjects)
      .where(
        notExists(
          this.db
            .select()
            .from(tutories)
            .where(
              and(
                eq(tutories.subjectId, subjects.id),
                eq(tutories.tutorId, tutorId),
              ),
            ),
        ),
      );

    return results.map((subject) => ({
      id: subject.id,
      name: subject.name,
      iconUrl: subject.iconUrl,
    }));
  }

  public async createSubject(name: string, iconUrl: string) {
    const [subjectId] = await this.db
      .insert(subjects)
      .values({ name, iconUrl })
      .returning({ id: subjects.id });

    return subjectId;
  }

  // Check if there are any subjects in the database. Used when seeding
  public async hasSubjects() {
    const result = await this.db.select().from(subjects);
    return result.length > 0;
  }

  public async checkSubjectExists(subjectId: string) {
    try {
      const result = await this.db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.id, subjectId))
        .limit(1);
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  public async validateInterests(interests: string[]) {
    try {
      const result = await this.db
        .select({ id: subjects.id })
        .from(subjects)
        .where(inArray(subjects.id, interests));

      return result.length === interests.length;
    } catch (error) {
      return false;
    }
  }
}
