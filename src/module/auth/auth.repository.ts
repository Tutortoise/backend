import { learners, tutors } from "@/db/schema";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { registerSchema } from "./auth.schema";
import type { db as dbType } from "@/db/config";

type RegisterSchema = z.infer<typeof registerSchema>;
export class AuthRepository {
  public static SALT_ROUNDS = 10;

  constructor(private readonly db: typeof dbType) {}

  public async checkEmailExists(email: string) {
    const [existingLearner, existingTutor] = await Promise.all([
      this.db
        .select({ id: learners.id })
        .from(learners)
        .where(eq(learners.email, email))
        .limit(1),

      this.db
        .select({ id: tutors.id })
        .from(tutors)
        .where(eq(tutors.email, email))
        .limit(1),
    ]);

    return existingLearner.length > 0 || existingTutor.length > 0;
  }

  public async registerUser(data: RegisterSchema["body"]) {
    if (data.role === "learner") {
      return this.registerLearner(data);
    }

    return this.registerTutor(data);
  }

  public async getUser(userId: string) {
    const [learner, tutor] = await Promise.all([
      this.db
        .select({ id: learners.id, name: learners.name, email: learners.email })
        .from(learners)
        .where(eq(learners.id, userId))
        .limit(1),
      this.db
        .select({ id: tutors.id, name: tutors.name, email: tutors.email })
        .from(tutors)
        .where(eq(tutors.id, userId))
        .limit(1),
    ]);

    return learner[0] || tutor[0];
  }

  public async login(email: string, password: string) {
    const [learner, tutor] = await Promise.all([
      this.db.select().from(learners).where(eq(learners.email, email)).limit(1),
      this.db.select().from(tutors).where(eq(tutors.email, email)).limit(1),
    ]);

    // Check if user exists
    const user = learner[0] || tutor[0];
    if (!user) return null;

    // Check if password correct
    const isPasswordCorrect = await AuthRepository.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordCorrect) return null;

    return { ...user, role: learner[0] ? "learner" : "tutor" };
  }

  /**
   * Register a new learner
   */
  private async registerLearner(data: RegisterSchema["body"]) {
    const hashedPassword = await this.hashPassword(data.password);

    // Insert new learner
    const [newLearner] = await this.db
      .insert(learners)
      .values({
        ...data,
        password: hashedPassword,
      })
      .returning({
        id: learners.id,
      });

    return newLearner;
  }

  /**
   * Register a new tutor
   */
  private async registerTutor(data: RegisterSchema["body"]) {
    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Insert new tutor
    const [newTutor] = await this.db
      .insert(tutors)
      .values({
        ...data,
        password: hashedPassword,
      })
      .returning({
        id: tutors.id,
      });

    return newTutor;
  }

  private async hashPassword(password: string) {
    return hash(password, AuthRepository.SALT_ROUNDS);
  }

  public static async comparePassword(
    password: string,
    hashedPassword: string,
  ) {
    return compare(password, hashedPassword);
  }
}
