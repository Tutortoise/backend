import type { db as dbType } from "@/db/config";
import { eq } from "drizzle-orm";
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

  public async checkSubjectExists(subjectId: string) {
    const result = await this.db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);
    return result.length > 0;
  }
}
