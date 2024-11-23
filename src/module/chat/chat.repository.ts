import { db as dbType } from "@/db/config";
import { chatRooms, chatMessages, learners, tutors } from "@/db/schema";
import { eq, and, desc, lt, not } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { MessageType, UserRole } from "@/db/schema";
import { ChatRoomWithParticipants } from "./chat.types";

export class ChatRepository {
  constructor(private readonly db: typeof dbType) {}

  async createRoom(learnerId: string, tutorId: string) {
    const [room] = await this.db
      .insert(chatRooms)
      .values({
        learnerId,
        tutorId,
      })
      .returning();

    return room;
  }

  async getRoomById(roomId: string) {
    try {
      const [room] = await this.db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.id, roomId))
        .limit(1);

      return room || null;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("invalid input syntax for type uuid")
      ) {
        return null;
      }
      throw error;
    }
  }

  async getRoomsByUser(userId: string, role: "learner" | "tutor") {
    return this.db
      .select()
      .from(chatRooms)
      .where(
        role === "learner"
          ? eq(chatRooms.learnerId, userId)
          : eq(chatRooms.tutorId, userId),
      )
      .orderBy(desc(chatRooms.lastMessageAt));
  }

  async createMessage(
    roomId: string,
    senderId: string,
    senderRole: UserRole,
    content: string,
    type: MessageType,
  ) {
    const [message] = await this.db
      .insert(chatMessages)
      .values({
        roomId,
        senderId,
        senderRole,
        content,
        type,
      })
      .returning();

    await this.db
      .update(chatRooms)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    return message;
  }

  async getRoomMessages(roomId: string, before?: Date, limit: number = 20) {
    const conditions = [eq(chatMessages.roomId, roomId)];

    if (before) {
      conditions.push(lt(chatMessages.sentAt, before));
    }

    return await this.db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(desc(chatMessages.sentAt))
      .limit(limit);
  }

  async getRoomWithParticipants(
    roomId: string,
  ): Promise<ChatRoomWithParticipants | null> {
    const [result] = await this.db
      .select({
        room: chatRooms,
        learnerName: learners.name,
        tutorName: tutors.name,
      })
      .from(chatRooms)
      .leftJoin(learners, eq(chatRooms.learnerId, learners.id))
      .leftJoin(tutors, eq(chatRooms.tutorId, tutors.id))
      .where(eq(chatRooms.id, roomId));

    if (!result || !result.learnerName || !result.tutorName) return null;

    return {
      ...result.room,
      learnerName: result.learnerName,
      tutorName: result.tutorName,
    };
  }

  async getRoomsWithParticipants(userId: string, role: UserRole) {
    try {
      const rooms = await this.db
        .select({
          id: chatRooms.id,
          learnerId: chatRooms.learnerId,
          tutorId: chatRooms.tutorId,
          lastMessageAt: chatRooms.lastMessageAt,
          createdAt: chatRooms.createdAt,
          learnerName: learners.name,
          tutorName: tutors.name,
          lastMessage: sql<{ content: string; type: MessageType }>`
            (SELECT json_build_object(
              'content', content,
              'type', type
            )
            FROM ${chatMessages}
            WHERE ${chatMessages.roomId} = ${chatRooms.id}
            ORDER BY ${chatMessages.sentAt} DESC
            LIMIT 1)`,
        })
        .from(chatRooms)
        .innerJoin(learners, eq(chatRooms.learnerId, learners.id))
        .innerJoin(tutors, eq(chatRooms.tutorId, tutors.id))
        .where(
          role === "learner"
            ? eq(chatRooms.learnerId, userId)
            : eq(chatRooms.tutorId, userId),
        )
        .orderBy(desc(chatRooms.lastMessageAt));

      return rooms;
    } catch (error) {
      console.error("Error getting rooms:", error);
      throw error;
    }
  }

  async markMessagesAsRead(roomId: string, userId: string) {
    await this.db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.roomId, roomId),
          not(eq(chatMessages.senderId, userId)), // Mark messages not from the current user as read
          eq(chatMessages.isRead, false),
        ),
      );
  }
}
