import type { db as dbType } from "@/db/config";
import { categories, tutories } from "@/db/schema";
import { and, desc, eq, inArray, notExists, sql } from "drizzle-orm";

export class CategoryRepository {
  constructor(private readonly db: typeof dbType) {}

  public async getAllCategories() {
    const results = await this.db.select().from(categories);
    return results.map((category) => ({
      id: category.id,
      name: category.name,
      iconUrl: category.iconUrl,
    }));
  }

  public async getPopularCategories() {
    const results = await this.db
      .select({
        id: categories.id,
        name: categories.name,
        iconUrl: categories.iconUrl,
        tutoriesCount: sql<number>`COUNT(${tutories.id})::int`,
      })
      .from(categories)
      .leftJoin(tutories, eq(categories.id, tutories.categoryId))
      .groupBy(categories.id)
      .orderBy(desc(sql`COUNT(${tutories.id})`));

    return results.map((category) => ({
      id: category.id,
      name: category.name,
      iconUrl: category.iconUrl,
      tutoriesCount: category.tutoriesCount,
    }));
  }

  public async getAvailableCategories(tutorId: string) {
    const results = await this.db
      .select()
      .from(categories)
      .where(
        notExists(
          this.db
            .select()
            .from(tutories)
            .where(
              and(
                eq(tutories.categoryId, categories.id),
                eq(tutories.tutorId, tutorId),
              ),
            ),
        ),
      );

    return results.map((category) => ({
      id: category.id,
      name: category.name,
      iconUrl: category.iconUrl,
    }));
  }

  public async createCategory(name: string, iconUrl: string) {
    const [categoryId] = await this.db
      .insert(categories)
      .values({ name, iconUrl })
      .returning({ id: categories.id });

    return categoryId;
  }

  // Check if there are any categories in the database. Used when seeding
  public async hasCategories() {
    const result = await this.db.select().from(categories);
    return result.length > 0;
  }

  public async checkCategoryExists(categoryId: string) {
    try {
      const result = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  public async validateInterests(interests: string[]) {
    try {
      const result = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.id, interests));

      return result.length === interests.length;
    } catch (error) {
      return false;
    }
  }
}
