import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";
import { learners, tutories, tutors } from "./db/schema";

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

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Learner = typeof learners.$inferInsert;
export type Tutor = typeof tutors.$inferInsert;
export type Tutories = typeof tutories.$inferInsert;

export interface Category {
  name: string;
  iconUrl: string;
}

export type GetTutoriesFilters = {
  q?: string | null;
  categoryId?: string | null;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  typeLesson?: "online" | "offline" | "both" | null;
  tutorId?: string | null;
  city?: string | null;
  minRating?: number | null;
  isEnabled?: boolean;
};

export interface UserPresence {
  isOnline: boolean;
  lastSeen: number;
  currentChatRoom?: string;
}

export interface ChatRoomPresence {
  [userId: string]: {
    isTyping: boolean;
    lastTypingAt: number;
  };
}
