import { Router } from "express";
import * as chatController from "@/module/chat/chat.controller";
import { firebaseAuthMiddleware } from "@/module/auth/auth.middleware";
import {
  validateChatImageUpload,
  validator,
} from "@middleware/validation.middleware";
import {
  createRoomSchema,
  getRoomMessagesSchema,
  sendMessageSchema,
} from "@/module/chat/chat.schema";
import { z } from "zod";

const chatRouter = Router();

chatRouter.use(firebaseAuthMiddleware);

chatRouter.post(
  "/rooms",
  validator(createRoomSchema),
  chatController.createRoom,
);
chatRouter.get("/rooms", chatController.getRooms);
chatRouter.get(
  "/rooms/:roomId/messages",
  validator(getRoomMessagesSchema),
  chatController.getRoomMessages,
);
chatRouter.post(
  "/rooms/:roomId/messages",
  validator(sendMessageSchema),
  validateChatImageUpload,
  chatController.sendMessage,
);

chatRouter.post(
  "/rooms/:roomId/typing",
  validator(
    z.object({
      params: z.object({
        roomId: z.string(),
      }),
      body: z.object({
        isTyping: z.boolean(),
      }),
    }),
  ), // I would prefer to use inline validation for this time (re: less abstraction)
  chatController.updateTypingStatus,
);

chatRouter.get(
  "/rooms/:roomId/presence",
  validator(
    z.object({
      params: z.object({
        roomId: z.string(),
      }),
    }),
  ), // same here
  chatController.getRoomPresence,
);

export default chatRouter;