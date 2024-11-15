import { tutorSchema, tutorServiceSchema } from "@schemas/tutor.schema";
import { learnerSchema } from "@schemas/learner.schema";
import type { RequestHandler } from "express";
import { z } from "zod";

interface RequestData {
  body?: Record<string, any>;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface Controller<T extends RequestData = RequestData>
  extends RequestHandler<T["params"], {}, T["body"], T["query"]> {}

export type Learner = z.infer<typeof learnerSchema>;
export type Tutor = z.infer<typeof tutorSchema>;
export type Service = z.infer<typeof tutorServiceSchema>;

export interface Subject {
  name: string;
  iconUrl: string;
}
