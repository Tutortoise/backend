import { app } from "@/main";
import supertest from "supertest";
import { describe, expect, test } from "vitest";

describe("Get all subjects", () => {
  test("It should return all subjects", async () => {
    const res = await supertest(app).get("/api/v1/subjects").expect(200);

    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("iconUrl");
  });
});
