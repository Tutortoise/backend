import { tutorSchema } from "@schemas/tutor.schema";
import { learnerSchema } from "@schemas/learner.schema";
import { z } from "zod";
import { tutorServiceSchema } from "@schemas/tutorService.schema";
import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";

interface RequestData {
  body?: unknown;
  params?: Record<string, string>;
  query?: ParsedQs;
}

export interface Controller<T extends RequestData = RequestData> {
  (
    req: Request<T["params"], unknown, T["body"], T["query"]>,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
}

export type Learner = z.infer<typeof learnerSchema>;
export type Tutor = z.infer<typeof tutorSchema>;
export type TutorService = z.infer<typeof tutorServiceSchema>;

export interface Subject {
  name: string;
  iconUrl: string;
}
