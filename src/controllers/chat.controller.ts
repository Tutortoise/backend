import { firestore, bucket } from "@/config";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import {
  createRoomSchema,
  getRoomMessagesSchema,
  sendMessageSchema,
} from "@schemas/chat.schema";
import { ChatService } from "@services/chat.service";
import { z } from "zod";

// TODO: Implement FCM token management
// - Store FCM tokens when users login/register
// - Update tokens when they change
// - Remove tokens on logout
// - Group tokens by user for multi-device support

// TODO: Add realtime presence system
// - Track when users enter/leave chat rooms
// - Show typing indicators
// - Display online/offline status
const chatService = new ChatService({ firestore, bucket });

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

    const messages = await chatService.getRoomMessages(
      req.params.roomId,
      userId,
      req.query.before ? new Date(req.query.before as string) : undefined,
      req.query.limit as string,
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

type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export const sendMessage: Controller<SendMessageSchema> = async (req, res) => {
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

    const message = await chatService.sendMessage(
      req.params.roomId,
      userId,
      userRole,
      req.body,
    );

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
