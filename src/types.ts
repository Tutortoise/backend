import type { RequestHandler } from "express";

interface RequestData {
  body?: Record<string, any>;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface Controller<T extends RequestData = RequestData>
  extends RequestHandler<T["params"], {}, T["body"], T["query"]> {}

enum LearningStyle {
  VISUAL = "VISUAL",
  AUDITORY = "AUDITORY",
  KINESTHETIC = "KINESTHETIC",
}

interface User {
  id: string;
  phoneNum?: string;
  city?: string;
  interests?: string[];
  learningStyle?: LearningStyle;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date;
}
