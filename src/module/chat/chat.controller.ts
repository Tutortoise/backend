import { realtimeDb, firestore, bucket } from "@/config";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import {
  createRoomSchema,
  getRoomMessagesSchema,
  sendTextMessageSchema,
} from "@/module/chat/chat.schema";
import { ChatService } from "@/module/chat/chat.service";
import { PresenceService } from "@/module/chat/presence.service";
import { z } from "zod";
import { FCMService } from "@/common/fcm.service";

const typingStatusSchema = z.object({
  params: z.object({
    roomId: z.string(),
  }),
  body: z.object({
    isTyping: z.boolean(),
  }),
});

const roomPresenceSchema = z.object({
  params: z.object({
    roomId: z.string(),
  }),
});

type TypingStatusSchema = z.infer<typeof typingStatusSchema>;
type RoomPresenceSchema = z.infer<typeof roomPresenceSchema>;

const fcmService = new FCMService({ firestore });
const presenceService = new PresenceService({ realtimeDb });
const chatService = new ChatService({
  firestore,
  bucket,
  presenceService,
  fcmService,
});

type CreateRoomSchema = z.infer<typeof createRoomSchema>;
export const createRoom: Controller<CreateRoomSchema> = async (req, res) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;

    if (!userId) {
      res.status(403).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    if (userId !== req.body.learnerId && userId !== req.body.tutorId) {
      res.status(403).json({
        status: "error",
        message: "You can only create chat rooms that you are a participant of",
      });
      return;
    }

    const room = await chatService.createRoom(
      req.body.learnerId,
      req.body.tutorId,
    );

    res.status(201).json({
      status: "success",
      data: room,
    });
  } catch (error) {
    logger.error(`Failed to create chat room: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to create chat room",
    });
  }
};

export const getRooms: Controller = async (req, res) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    const userRole = req.learner ? "learner" : "tutor";

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    const rooms = await chatService.getRooms(userId, userRole);

    res.json({
      status: "success",
      data: rooms,
    });
  } catch (error) {
    logger.error(`Failed to get chat rooms: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get chat rooms",
    });
  }
};

type GetRoomMessagesSchema = z.infer<typeof getRoomMessagesSchema>;
export const getRoomMessages: Controller<GetRoomMessagesSchema> = async (
  req,
  res,
) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    const { roomId } = req.params;
    const { before, limit } = req.query;

    const messages = await chatService.getRoomMessages(
      roomId,
      userId,
      before ? new Date(before as string) : undefined,
      limit as string,
    );

    res.json({
      status: "success",
      data: messages,
    });
  } catch (error) {
    logger.error(`Failed to get room messages: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get room messages",
    });
  }
};

type SendTextMessageSchema = z.infer<typeof sendTextMessageSchema>;
export const sendMessage: Controller<SendTextMessageSchema> = async (
  req,
  res,
) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    const userRole = req.learner ? "learner" : "tutor";

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    const { roomId } = req.params;

    const messageType = req.file ? "image" : "text";
    const content =
      messageType === "image"
        ? req.file!.buffer.toString("base64")
        : req.body.content;

    const message = await chatService.sendMessage(roomId, userId, userRole, {
      content,
      type: messageType,
    });

    res.status(201).json({
      status: "success",
      data: message,
    });
  } catch (error) {
    logger.error(`Failed to send message: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to send message",
    });
  }
};

export const updateTypingStatus: Controller<TypingStatusSchema> = async (
  req,
  res,
) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    const { roomId } = req.params;
    const { isTyping } = req.body;

    await chatService.presenceService.updateTypingStatus(
      userId,
      roomId,
      isTyping,
    );

    res.json({ status: "success" });
  } catch (error) {
    logger.error(`Failed to update typing status: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to update typing status",
    });
  }
};

export const getRoomPresence: Controller<RoomPresenceSchema> = async (
  req,
  res,
) => {
  try {
    const { roomId } = req.params;
    const presence = await chatService.presenceService.getRoomPresence(roomId);

    res.json({
      status: "success",
      data: presence,
    });
  } catch (error) {
    logger.error(`Failed to get room presence: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get room presence",
    });
  }
};
