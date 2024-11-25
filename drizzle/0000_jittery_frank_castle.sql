CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'prefer not to say');--> statement-breakpoint
CREATE TYPE "public"."learning_style" AS ENUM('visual', 'auditory', 'kinesthetic');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'declined', 'scheduled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."type_lesson" AS ENUM('online', 'offline', 'both');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"learning_style" "learning_style",
	"gender" "gender",
	"phone_number" varchar(20),
	"latitude" real,
	"longitude" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "learners_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"learnerId" uuid NOT NULL,
	"tutorId" uuid NOT NULL,
	"tutoryId" uuid NOT NULL,
	"session_time" timestamp NOT NULL,
	"total_hours" integer NOT NULL,
	"notes" text,
	"status" "status",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon_url" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tutorId" uuid NOT NULL,
	"subjectId" uuid NOT NULL,
	"about_you" text NOT NULL,
	"teaching_methodology" text NOT NULL,
	"hourly_rate" integer NOT NULL,
	"type_lesson" "type_lesson",
	"availability" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tutors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"gender" "gender",
	"phone_number" varchar(20),
	"latitude" real,
	"longitude" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "tutors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_learnerId_learners_id_fk" FOREIGN KEY ("learnerId") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_tutorId_tutors_id_fk" FOREIGN KEY ("tutorId") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_tutoryId_tutories_id_fk" FOREIGN KEY ("tutoryId") REFERENCES "public"."tutories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutories" ADD CONSTRAINT "tutories_tutorId_tutors_id_fk" FOREIGN KEY ("tutorId") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutories" ADD CONSTRAINT "tutories_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
