import { tutorSchema } from "@/module/tutor/tutor.schema";
import { learnerSchema } from "@/module/learner/learner.schema";
import { z } from "zod";
import { tutoriesSchema } from "@/module/tutories/tutories.schema";
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
export type Tutories = z.infer<typeof tutoriesSchema>;

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
