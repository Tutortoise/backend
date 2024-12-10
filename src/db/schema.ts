import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  integer,
  text,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "prefer not to say",
]);
export const learningStyleEnum = pgEnum("learning_style", [
  "visual",
  "auditory",
  "kinesthetic",
]);
export const typeLessonEnum = pgEnum("type_lesson", [
  "online",
  "offline",
  "both",
]);
export const orderStatusEnum = pgEnum("status", [
  "pending",
  "declined",
  "canceled",
  "scheduled",
  "completed",
]);

export const USER_ROLES = ["learner", "tutor"] as const;
export const MESSAGE_TYPES = ["text", "image"] as const;

export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const messageTypeEnum = pgEnum("message_type", MESSAGE_TYPES);

export type UserRole = (typeof USER_ROLES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "order_accepted",
  "order_declined",
  "order_canceled",
  "new_order",
  "chat_message",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationTypeEnum = pgEnum(
  "notification_type",
  NOTIFICATION_TYPES,
);

// Tables
export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  iconUrl: varchar("icon_url", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const interests = pgTable("interests", {
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
});

export const learners = pgTable("learners", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  learningStyle: learningStyleEnum("learning_style"),
  gender: genderEnum("gender"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  city: varchar({ length: 255 }),
  district: varchar({ length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const tutors = pgTable("tutors", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  gender: genderEnum("gender"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  city: varchar({ length: 255 }),
  district: varchar({ length: 255 }),
  availability: jsonb("availability").$type<TutorAvailability>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type TutorAvailability = {
  0?: string[];
  1?: string[];
  2?: string[];
  3?: string[];
  4?: string[];
  5?: string[];
  6?: string[];
};

export const tutories = pgTable(
  "tutories",
  {
    id: uuid().primaryKey().defaultRandom(),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => tutors.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: varchar({ length: 50 }).notNull(),
    aboutYou: text("about_you").notNull(),
    teachingMethodology: text("teaching_methodology").notNull(),
    hourlyRate: integer("hourly_rate").notNull(),
    typeLesson: typeLessonEnum("type_lesson").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => ({
    hourlyRateIdx: index().on(table.hourlyRate),
    typeLessonIdx: index().on(table.typeLesson),
    createdAtIdx: index().on(table.createdAt),
    tutorIdCategoryIdx: index().on(table.tutorId, table.categoryId),
  }),
);

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    tutoriesId: uuid("tutories_id")
      .notNull()
      .references(() => tutories.id, { onDelete: "cascade" }),
    sessionTime: timestamp("session_time").notNull(),
    estimatedEndTime: timestamp("estimated_end_time").notNull(),
    totalHours: integer("total_hours").notNull(),
    notes: text("notes"),
    typeLesson: typeLessonEnum("type_lesson").notNull(),
    status: orderStatusEnum("status"),
    price: integer("price").notNull(),
    reviewDismissedAt: timestamp("review_dismissed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => ({
    learnerIdIdx: index().on(table.learnerId),
    tutoriesIdIdx: index().on(table.tutoriesId),
    statusIdx: index().on(table.status),
    sessionTimeIdx: index().on(table.sessionTime),
    statusCreatedAtIdx: index().on(table.status, table.createdAt),
    learnerStatusIdx: index().on(table.learnerId, table.status),
  }),
);

export const chatRooms = pgTable("chat_rooms", {
  id: uuid().primaryKey().defaultRandom(),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id),
  tutorId: uuid("tutor_id")
    .notNull()
    .references(() => tutors.id),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => chatRooms.id),
    senderId: uuid("sender_id").notNull(),
    senderRole: userRoleEnum("sender_role").notNull(),
    content: text("content").notNull(),
    type: messageTypeEnum("type").notNull(),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    isRead: boolean("is_read").notNull().default(false),
  },
  (table) => {
    return {
      roomIdSentAtIdx: index("chat_messages_room_sent_idx").on(
        table.roomId,
        table.sentAt,
      ),
      senderIdIdx: index("chat_messages_sender_idx").on(table.senderId),
    };
  },
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: varchar("message", { length: 255 }).notNull(),
    data: jsonb("data").$type<Record<string, any>>(),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

export const fcmTokens = pgTable(
  "fcm_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    token: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => ({
    tokenUserIdx: uniqueIndex().on(table.userId, table.token),
    userIdIdx: index().on(table.userId),
  }),
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    message: text("message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    ratingIdx: index().on(table.rating),
    createdAtIdx: index().on(table.createdAt),
  }),
);

export const interestRelations = relations(interests, ({ one }) => ({
  learner: one(learners, {
    fields: [interests.learnerId],
    references: [learners.id],
  }),
  category: one(categories, {
    fields: [interests.categoryId],
    references: [categories.id],
  }),
}));

export const learnerRelations = relations(learners, ({ many }) => ({
  orders: many(orders),
}));

export const tutorRelations = relations(tutors, ({ many }) => ({
  tutories: many(tutories),
  orders: many(orders),
}));

export const tutoriesRelations = relations(tutories, ({ one, many }) => ({
  tutor: one(tutors, {
    fields: [tutories.tutorId],
    references: [tutors.id],
  }),
  category: one(categories, {
    fields: [tutories.categoryId],
    references: [categories.id],
  }),
  orders: many(orders),
}));

export const orderRelations = relations(orders, ({ one }) => ({
  learner: one(learners, {
    fields: [orders.learnerId],
    references: [learners.id],
  }),
  tutories: one(tutories, {
    fields: [orders.tutoriesId],
    references: [tutories.id],
  }),
  review: one(reviews, {
    fields: [orders.id],
    references: [reviews.orderId],
  }),
}));

export const chatRoomRelations = relations(chatRooms, ({ one, many }) => ({
  learner: one(learners, {
    fields: [chatRooms.learnerId],
    references: [learners.id],
  }),
  tutor: one(tutors, {
    fields: [chatRooms.tutorId],
    references: [tutors.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
}));

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
  learner: one(learners, {
    fields: [fcmTokens.userId],
    references: [learners.id],
  }),
  tutor: one(tutors, {
    fields: [fcmTokens.userId],
    references: [tutors.id],
  }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));
