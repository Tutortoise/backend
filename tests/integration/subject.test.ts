import { app } from "@/main";
import { seedSubjects } from "@/module/subject/subject.seeder";
import supertest from "supertest";
import { beforeAll, describe, expect, test } from "vitest";

beforeAll(async () => {
  await seedSubjects();
});

describe("Get all subjects", () => {
  test("It should return all subjects", async () => {
    const res = await supertest(app).get("/api/v1/subjects").expect(200);

    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("iconUrl");
  });
});
