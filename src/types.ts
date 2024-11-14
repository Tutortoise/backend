import { tutorSchema, tutorServiceSchema } from "@schemas/tutor.schema";
import { userSchema } from "@schemas/user.schema";
import type { RequestHandler } from "express";
import { z } from "zod";

interface RequestData {
  body?: Record<string, any>;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface Controller<T extends RequestData = RequestData>
  extends RequestHandler<T["params"], {}, T["body"], T["query"]> {}

export type User = z.infer<typeof userSchema>;
export type Tutor = z.infer<typeof tutorSchema>;
export type Service = z.infer<typeof tutorServiceSchema>;

export interface Subject {
  name: string;
  iconUrl: string;
}
