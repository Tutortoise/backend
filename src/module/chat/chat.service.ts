import { Bucket } from "@google-cloud/storage";
import { ChatRepository } from "./chat.repository";
import { PresenceService } from "@/module/chat/presence.service";
import { convertToJpg } from "@/helpers/image.helper";
import { FCMService } from "@/common/fcm.service";
import { UserRole } from "@/db/schema";
import { MessageData } from "./chat.types";

interface ChatServiceDependencies {
  chatRepository: ChatRepository;
  bucket: Bucket;
  presenceService: PresenceService;
  fcmService: FCMService;
}

export class ChatService {
  private readonly chatRepository: ChatRepository;
  private readonly bucket: Bucket;
  public readonly presenceService: PresenceService;
  private readonly fcmService: FCMService;

  constructor(private readonly deps: ChatServiceDependencies) {
    this.chatRepository = deps.chatRepository;
    this.bucket = deps.bucket;
    this.presenceService = deps.presenceService;
    this.fcmService = deps.fcmService;
  }

  async createRoom(learnerId: string, tutorId: string) {
    try {
      return await this.deps.chatRepository.createRoom(learnerId, tutorId);
    } catch (error) {
      throw new Error(`Failed to create chat room: ${error}`);
    }
  }

  async getRooms(userId: string, role: UserRole) {
    return this.deps.chatRepository.getRoomsWithParticipants(userId, role);
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    before?: Date,
    limit?: number,
  ) {
    try {
      const room = await this.deps.chatRepository.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      if (room.learnerId !== userId && room.tutorId !== userId) {
        throw new Error("Unauthorized access to chat room");
      }

      await this.chatRepository.markMessagesAsRead(roomId, userId);
      return this.deps.chatRepository.getRoomMessages(roomId, before, limit);
    } catch (error) {
      if (error instanceof Error && error.message === "Room not found") {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message === "Unauthorized access to chat room"
      ) {
        throw error;
      }
      throw new Error(`Failed to get room messages: ${error}`);
    }
  }

  async sendMessage(
    roomId: string,
    senderId: string,
    senderRole: UserRole,
    message: MessageData,
  ) {
    const room = await this.deps.chatRepository.getRoomById(roomId);
    if (!room) throw new Error("Room not found");

    if (message.type === "image") {
      try {
        const imageBuffer = Buffer.from(message.content, "base64");
        const convertedImage = await convertToJpg(imageBuffer);
        const filePath = `chat-images/${roomId}/${Date.now()}.jpg`;
        const file = this.deps.bucket.file(filePath);

        await file.save(convertedImage, {
          contentType: "image/jpeg",
          public: true,
        });

        message.content = file.publicUrl();
      } catch (error) {
        throw new Error("Failed to upload image");
      }
    }

    const newMessage = await this.deps.chatRepository.createMessage(
      roomId,
      senderId,
      senderRole,
      message.content,
      message.type,
    );

    const roomDetails =
      await this.deps.chatRepository.getRoomWithParticipants(roomId);
    if (roomDetails) {
      const recipientId =
        senderRole === "learner" ? room.tutorId : room.learnerId;
      const senderName =
        senderRole === "learner"
          ? roomDetails.learnerName
          : roomDetails.tutorName;

      this.deps.fcmService.sendChatNotification(
        recipientId,
        senderName,
        senderId,
        message,
        roomId,
      );
    }

    return newMessage;
  }
}
