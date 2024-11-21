import { Bucket } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { Firestore } from "firebase-admin/firestore";
import { PresenceService } from "@/module/chat/presence.service";
import { convertToJpg } from "@/helpers/image.helper";

interface ChatServiceDependencies {
  firestore: Firestore;
  bucket: Bucket;
  presenceService: PresenceService;
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

interface MessageData {
  content: string;
  type: "text" | "image";
}

// TODO: Implement FCM push notifications for chat
// - Send push notification when receiving new messages while app is in background
// - Include sender name, message preview in notification
// - Deep link notification to specific chat room

export class ChatService {
  private firestore: Firestore;
  private bucket: Bucket;
  public presenceService: PresenceService;

  constructor({ firestore, bucket, presenceService }: ChatServiceDependencies) {
    this.firestore = firestore;
    this.bucket = bucket;
    this.presenceService = presenceService;
  }

  async createRoom(learnerId: string, tutorId: string): Promise<ChatRoom> {
    const [learnerDoc, tutorDoc] = await Promise.all([
      this.firestore.collection("learners").doc(learnerId).get(),
      this.firestore.collection("tutors").doc(tutorId).get(),
    ]);

    if (!learnerDoc.exists || !tutorDoc.exists) {
      throw new Error("Learner or tutor not found");
    }

    const existingRoom = await this.firestore
      .collection("chat_rooms")
      .where("learnerId", "==", learnerId)
      .where("tutorId", "==", tutorId)
      .get();

    if (!existingRoom.empty) {
      const room = existingRoom.docs[0];
      return {
        id: room.id,
        ...room.data(),
      } as ChatRoom;
    }

    const roomData = {
      learnerId,
      tutorId,
      learnerName: learnerDoc.data()?.name,
      tutorName: tutorDoc.data()?.name,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };

    const roomRef = await this.firestore.collection("chat_rooms").add(roomData);

    return {
      id: roomRef.id,
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
      .orderBy("sentAt", "desc");

    if (before) {
      query = query.startAfter(before);
    }

    query = query.limit(limitNum);

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
    message: MessageData,
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
      throw new Error("Not authorized to send messages in this room");
    }

    const now = new Date();
    let finalContent = message.content;

    if (message.type === "image") {
      try {
        const imageBuffer = Buffer.from(message.content, "base64");
        const downgradedImage = await convertToJpg(imageBuffer);
        const imagePath = `chat-images/${roomId}/${now.getTime()}.jpg`;
        const file = this.bucket.file(imagePath);

        await file.save(downgradedImage, {
          contentType: "image/jpeg",
          public: true,
        });

        finalContent = file.publicUrl();
      } catch (error) {
        logger.error("Failed to upload image:", error);
        throw new Error("Failed to upload image");
      }
    }

    const messageData: Omit<ChatMessage, "id"> = {
      roomId,
      senderId,
      senderRole,
      content: finalContent,
      type: message.type,
      sentAt: now,
      isRead: false,
    };

    const messageRef = await this.firestore
      .collection("chat_messages")
      .add(messageData);

    await this.firestore
      .collection("chat_rooms")
      .doc(roomId)
      .update({
        lastMessageAt: now,
        lastMessage: {
          content: finalContent,
          type: message.type,
        },
      });

    return {
      id: messageRef.id,
      ...messageData,
    };
  }

  subscribeToRoomMessages(
    roomId: string,
    callback: (message: ChatMessage) => void,
  ): () => void {
    const messagesRef = this.firestore
      .collection("chat_messages")
      .where("roomId", "==", roomId)
      .orderBy("sentAt", "desc")
      .limit(1);

    const unsubscribe = messagesRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const message = {
            id: change.doc.id,
            ...change.doc.data(),
            sentAt: change.doc.data().sentAt.toDate(),
          } as ChatMessage;
          callback(message);
        }
      });
    });

    return unsubscribe;
  }
}
