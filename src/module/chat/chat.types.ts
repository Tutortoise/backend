import type { UserRole, MessageType } from "@/db/schema";

export interface ChatRoom {
  id: string;
  learnerId: string;
  tutorId: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface ChatRoomWithParticipants extends ChatRoom {
  learnerName: string;
  tutorName: string;
  lastMessage?: {
    content: string;
    type: MessageType;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  type: MessageType;
  sentAt: Date;
  isRead: boolean;
}

export interface MessageData {
  content: string;
  type: MessageType;
}
