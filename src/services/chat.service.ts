import { Bucket } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { Firestore } from "firebase-admin/firestore";

interface ChatServiceDependencies {
  firestore: Firestore;
  bucket: Bucket;
}

interface ChatRoom {
  id: string;
  learnerId: string;
  tutorId: string;
  learnerName: string;
  tutorName: string;
  lastMessageAt: Date;
  lastMessage?: {
    content: string;
    type: "text" | "image";
  };
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: "learner" | "tutor";
  content: string;
  type: "text" | "image";
  sentAt: Date;
  isRead: boolean;
}

// TODO: Implement realtime updates using Firebase Realtime Database or Firestore's onSnapshot
// - Convert chat room and message listeners to realtime subscriptions
// - Update client immediately when new messages arrive
// - Show typing indicators in real-time
// - Show online/offline status

// TODO: Implement FCM push notifications for chat
// - Send push notification when receiving new messages while app is in background
// - Include sender name, message preview in notification
// - Deep link notification to specific chat room
export class ChatService {
  private firestore: Firestore;
  private bucket: Bucket;

  constructor({ firestore, bucket }: ChatServiceDependencies) {
    this.firestore = firestore;
    this.bucket = bucket;
  }

  async createRoom(learnerId: string, tutorId: string): Promise<ChatRoom> {
    const [learnerDoc, tutorDoc] = await Promise.all([
      this.firestore.collection("learners").doc(learnerId).get(),
      this.firestore.collection("tutors").doc(tutorId).get(),
    ]);

    if (!learnerDoc.exists) {
      throw new Error("Learner not found");
    }

    if (!tutorDoc.exists) {
      throw new Error("Tutor not found");
    }

    const existingRoom = await this.firestore
      .collection("chat_rooms")
      .where("learnerId", "==", learnerId)
      .where("tutorId", "==", tutorId)
      .limit(1)
      .get();

    if (!existingRoom.empty) {
      const room = existingRoom.docs[0];
      return {
        id: room.id,
        ...room.data(),
      } as ChatRoom;
    }

    const roomRef = this.firestore.collection("chat_rooms").doc();
    const roomId = roomRef.id;

    const roomData = {
      learnerId,
      tutorId,
      learnerName: learnerDoc.data()?.name || "Unknown Learner",
      tutorName: tutorDoc.data()?.name || "Unknown Tutor",
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };

    await roomRef.set(roomData);

    return {
      id: roomId,
      ...roomData,
    };
  }

  async getRooms(
    userId: string,
    userRole: "learner" | "tutor",
  ): Promise<ChatRoom[]> {
    const query =
      userRole === "learner"
        ? this.firestore
            .collection("chat_rooms")
            .where("learnerId", "==", userId)
        : this.firestore
            .collection("chat_rooms")
            .where("tutorId", "==", userId);

    const rooms = await query.orderBy("lastMessageAt", "desc").get();

    return rooms.docs.map((room) => ({
      id: room.id,
      ...room.data(),
      lastMessageAt: room.data().lastMessageAt.toDate(),
    })) as ChatRoom[];
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    before?: Date,
    limit: string = "20",
  ): Promise<ChatMessage[]> {
    const limitNum = parseInt(limit, 10);

    const room = await this.firestore
      .collection("chat_rooms")
      .doc(roomId)
      .get();
    if (!room.exists) {
      throw new Error("Room not found");
    }

    const roomData = room.data()!;
    if (roomData.learnerId !== userId && roomData.tutorId !== userId) {
      throw new Error("Unauthorized access to chat room");
    }

    let query = this.firestore
      .collection("chat_messages")
      .where("roomId", "==", roomId)
      .orderBy("sentAt", "desc")
      .limit(limitNum);

    if (before) {
      query = query.where("sentAt", "<", before);
    }

    const messages = await query.get();

    const unreadMessages = messages.docs.filter(
      (doc) => !doc.data().isRead && doc.data().senderId !== userId,
    );

    if (unreadMessages.length > 0) {
      const batch = this.firestore.batch();
      unreadMessages.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
    }

    return messages.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt.toDate(),
    })) as ChatMessage[];
  }

  async sendMessage(
    roomId: string,
    senderId: string,
    senderRole: "learner" | "tutor",
    message: { content: string; type: "text" | "image" },
  ): Promise<ChatMessage> {
    const room = await this.firestore
      .collection("chat_rooms")
      .doc(roomId)
      .get();
    if (!room.exists) {
      throw new Error("Chat room not found");
    }

    const roomData = room.data()!;
    const isParticipant =
      senderRole === "learner"
        ? roomData.learnerId === senderId
        : roomData.tutorId === senderId;

    if (!isParticipant) {
      throw new Error("Unauthorized to send message in this chat room");
    }

    const messageRef = this.firestore.collection("chat_messages").doc();
    const messageId = messageRef.id;

    const now = new Date();
    let finalContent = message.content;

    if (message.type === "image") {
      try {
        const imageBuffer = Buffer.from(
          message.content.replace(/^data:image\/\w+;base64,/, ""),
          "base64",
        );

        const imagePath = `chat-images/${roomId}/${messageId}.jpg`;
        const file = this.bucket.file(imagePath);

        await file.save(imageBuffer, {
          metadata: {
            contentType: "image/jpeg",
          },
        });

        finalContent = file.publicUrl();
      } catch (error) {
        logger.error("Failed to upload image:", error);
        throw new Error("Failed to upload image");
      }
    }

    const messageData = {
      roomId,
      senderId,
      senderRole,
      content: finalContent,
      type: message.type,
      sentAt: now,
      isRead: false,
    };

    await this.firestore.runTransaction(async (transaction) => {
      transaction.set(messageRef, messageData);

      transaction.update(this.firestore.collection("chat_rooms").doc(roomId), {
        lastMessageAt: now,
        lastMessage: {
          content: finalContent,
          type: message.type,
        },
      });
    });

    return {
      id: messageId,
      ...messageData,
    };
  }
}
