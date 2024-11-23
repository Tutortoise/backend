import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  real,
  integer,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

import { v4 as uuidv4 } from "uuid";

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
  "scheduled",
  "completed",
]);

// Tables
export const subjects = pgTable("subjects", {
  id: uuid()
    .primaryKey()
    .$default(() => uuidv4()),
  name: varchar({ length: 255 }).notNull(),
  iconUrl: varchar("icon_url", { length: 255 }),
  created_at: timestamp()
    .notNull()
    .$default(() => new Date()),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const learners = pgTable("learners", {
  id: uuid()
    .primaryKey()
    .$default(() => uuidv4()),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  learningStyle: learningStyleEnum("learning_style"),
  gender: genderEnum("gender"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const tutors = pgTable("tutors", {
  id: uuid()
    .primaryKey()
    .$default(() => uuidv4()),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  gender: genderEnum("gender"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

type TutorAvailability = {
  [key: number]: string[]; // day index: array of time slots
};

export const tutories = pgTable("tutories", {
  id: uuid()
    .primaryKey()
    .$default(() => uuidv4()),
  tutorId: uuid()
    .notNull()
    .references(() => tutors.id, { onDelete: "cascade" }),
  subjectId: uuid()
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  aboutYou: text("about_you").notNull(),
  teachingMethodology: text("teaching_methodology").notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  typeLesson: typeLessonEnum("type_lesson"),
  availability: jsonb("availability").$type<TutorAvailability>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const orders = pgTable("orders", {
  id: uuid()
    .primaryKey()
    .$default(() => uuidv4()),
  learnerId: uuid()
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  tutorId: uuid()
    .notNull()
    .references(() => tutors.id, { onDelete: "cascade" }),
  tutoryId: uuid()
    .notNull()
    .references(() => tutories.id, { onDelete: "cascade" }),
  sessionTime: timestamp("session_time").notNull(),
  totalHours: integer("total_hours").notNull(),
  notes: text("notes"),
  status: orderStatusEnum("status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const learnerRelations = relations(learners, ({ many }) => ({
  orders: many(orders),
}));

export const tutorRelations = relations(tutors, ({ many }) => ({
  tutories: many(tutories),
  orders: many(orders),
}));

export const tutoryRelations = relations(tutories, ({ one, many }) => ({
  tutor: one(tutors, {
    fields: [tutories.tutorId],
    references: [tutors.id],
  }),
  subject: one(subjects, {
    fields: [tutories.subjectId],
    references: [subjects.id],
  }),
  orders: many(orders),
}));

export const orderRelations = relations(orders, ({ one }) => ({
  learner: one(learners, {
    fields: [orders.learnerId],
    references: [learners.id],
  }),
  tutor: one(tutors, {
    fields: [orders.tutorId],
    references: [tutors.id],
  }),
  tutory: one(tutories, {
    fields: [orders.tutoryId],
    references: [tutories.id],
  }),
}));
