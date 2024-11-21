import { app } from "@/main";
import { seedTutors } from "@/module/tutor/tutor.seeder";
import { seedServices } from "@/module/tutor-service/tutorService.seeder";
import supertest from "supertest";
import { beforeAll, describe, test } from "vitest";

beforeAll(async () => {
  await seedTutors();
  await seedServices({ randomTeachingMethodology: true });
});

describe("Get tutor services", async () => {
  test("Get all tutor services without token", async () => {
    await supertest(app).get("/api/v1/tutors/services").expect(401);
  });
});
