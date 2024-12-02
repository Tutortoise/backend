import { app } from "@/main";
import supertest from "supertest";
import { describe, expect, test } from "vitest";

describe("Get all categories", () => {
  test("It should return all categories", async () => {
    const res = await supertest(app).get("/api/v1/categories").expect(200);

    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("iconUrl");
  });
});
