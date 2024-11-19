import { Router } from "express";
import * as chatController from "@controllers/chat.controller";
import { firebaseAuthMiddleware } from "@middleware/auth.middleware";
import {
  validateChatImageUpload,
  validator,
} from "@middleware/validation.middleware";
import {
  createRoomSchema,
  getRoomMessagesSchema,
  sendMessageSchema,
} from "@schemas/chat.schema";

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

export default chatRouter;
