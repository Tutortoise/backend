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

export type Learner = typeof learners.$inferInsert;
export type Tutor = typeof tutors.$inferInsert;
export type Tutories = typeof tutories.$inferInsert;

export interface Subject {
  name: string;
  iconUrl: string;
}

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
