import { jwtAuthMiddleware } from "@/module/auth/auth.middleware";
import * as chatController from "@/module/chat/chat.controller";
import {
  createRoomSchema,
  getRoomMessagesSchema,
  sendTextMessageSchema,
} from "@/module/chat/chat.schema";
import {
  validateChatImageUpload,
  validator,
} from "@middleware/validation.middleware";
import { Router } from "express";
import { z } from "zod";

const chatRouter = Router();

chatRouter.use(jwtAuthMiddleware);

chatRouter.post(
  "/rooms",
  /* #swagger.tags = ['chat'] 
  #swagger.description = 'Create a new chat room'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/CreateRoomSchema" }
  } */
  validator(createRoomSchema),
  chatController.createRoom,
);
chatRouter.get(
  "/rooms",
  // #swagger.tags = ['chat']
  // #swagger.description = 'Get all chat rooms'
  chatController.getRooms,
);
chatRouter.get(
  "/rooms/:roomId/messages",
  // #swagger.tags = ['chat']
  // #swagger.description = 'Get messages in a chat room'
  validator(getRoomMessagesSchema),
  chatController.getRoomMessages,
);

// TODO: instead of using different routes for text and image messages, use a single route
// - For now i seperate it because of issue in zod that can't validate the request body properly
chatRouter.post(
  "/rooms/:roomId/messages/text",
  /* #swagger.tags = ['chat'] 
  #swagger.description = 'Send a text message'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/SendTextMessageSchema" }
  } */
  validator(sendTextMessageSchema),
  chatController.sendMessage,
);
chatRouter.post(
  "/rooms/:roomId/messages/image",
  /* #swagger.tags = ['chat']
    #swagger.requestBody = {
      required: true,
      content: {
        'image/jpg': {
          schema: {  type: 'string', format: 'binary' }
        }
      }
    } */
  validateChatImageUpload,
  chatController.sendMessage,
);

chatRouter.post(
  "/rooms/:roomId/typing",
  /* #swagger.tags = ['chat'] 
  #swagger.description = 'Update typing status'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/SetIsTypingSchema" }
  } */
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
  // #swagger.tags = ['chat']
  // #swagger.description = 'Get room presence'
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
