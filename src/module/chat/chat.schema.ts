import { z } from "zod";
import { ParsedQs } from "qs";

export const createRoomSchema = z.object({
  body: z.object({
    learnerId: z.string(),
    tutorId: z.string(),
  }),
});

export const sendTextMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Message cannot be empty"),
  }),
  params: z.object({
    roomId: z.string(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("text"),
      content: z.string().min(1, "Message cannot be empty"),
    }),
    z.object({
      type: z.literal("image"),
    }),
  ]),
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
export type SendTextMessageSchema = z.infer<typeof sendTextMessageSchema>;
export type GetRoomMessagesSchema = {
  params: { roomId: string };
  query: ParsedQs;
};
