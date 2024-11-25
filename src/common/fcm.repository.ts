import { db as dbType } from "@/db/config";
import { fcmTokens } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export class FCMRepository {
  constructor(private readonly db: typeof dbType) {}

  async storeToken(userId: string, token: string) {
    const [existingToken] = await this.db
      .select()
      .from(fcmTokens)
      .where(and(eq(fcmTokens.userId, userId), eq(fcmTokens.token, token)))
      .limit(1);

    if (!existingToken) {
      await this.db.insert(fcmTokens).values({
        userId,
        token,
        createdAt: new Date(),
      });
    }
  }

  async removeToken(userId: string, token: string) {
    await this.db
      .delete(fcmTokens)
      .where(and(eq(fcmTokens.userId, userId), eq(fcmTokens.token, token)));
  }

  async getUserTokens(userId: string): Promise<string[]> {
    const tokens = await this.db
      .select({ token: fcmTokens.token })
      .from(fcmTokens)
      .where(eq(fcmTokens.userId, userId));

    return tokens.map((t) => t.token);
  }

  async removeInvalidTokens(userId: string, invalidTokens: string[]) {
    await this.db
      .delete(fcmTokens)
      .where(
        and(
          eq(fcmTokens.userId, userId),
          inArray(fcmTokens.token, invalidTokens),
        ),
      );
  }
}
