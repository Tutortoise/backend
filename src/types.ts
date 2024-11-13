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

export interface Tutor {
  id: string;
  phoneNum?: string;
  location?: unknown; // not sure now
  coverageRange: number;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date;
}

export interface Subject {
  name: string;
  iconUrl: string;
}
