import { tutorSchema } from "@/module/tutor/tutor.schema";
import { learnerSchema } from "@/module/learner/learner.schema";
import { z } from "zod";
import { tutorServiceSchema } from "@/module/tutor-service/tutorService.schema";
import { ParsedQs } from "qs";
import { NextFunction, Request, Response } from "express";
import { orderSchema } from "./module/order/order.schema";

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
