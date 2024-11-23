import type { db as dbType } from "@/db/config";
import { eq, inArray } from "drizzle-orm";
import { subjects } from "@/db/schema";

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
    const result = await this.db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    return result.length > 0;
  }

  public async validateInterests(interests: string[]) {
    const result = await this.db
      .select({ id: subjects.id })
      .from(subjects)
      .where(inArray(subjects.id, interests));

    return result.length === interests.length;
  }
}
