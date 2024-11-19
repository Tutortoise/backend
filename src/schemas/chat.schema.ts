import { z } from "zod";
import { ParsedQs } from "qs";

export const createRoomSchema = z.object({
  body: z.object({
    learnerId: z.string(),
    tutorId: z.string(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Message cannot be empty"),
    type: z.enum(["text", "image"]),
  }),
  params: z.object({
    roomId: z.string(),
  }),
});

export const getRoomMessagesSchema = z.object({
  params: z.object({
    roomId: z.string(),
  }),
  query: z.object({
    before: z.string().optional(),
    limit: z.string().default("20"),
  }),
});

export type CreateRoomSchema = z.infer<typeof createRoomSchema>;
export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export type GetRoomMessagesSchema = {
  params: { roomId: string };
  query: ParsedQs;
};
