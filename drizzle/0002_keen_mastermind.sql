ALTER TABLE "learners" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "learners" ADD COLUMN "district" varchar(255);--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "district" varchar(255);--> statement-breakpoint
ALTER TABLE "learners" DROP COLUMN IF EXISTS "latitude";--> statement-breakpoint
ALTER TABLE "learners" DROP COLUMN IF EXISTS "longitude";--> statement-breakpoint
ALTER TABLE "tutors" DROP COLUMN IF EXISTS "latitude";--> statement-breakpoint
ALTER TABLE "tutors" DROP COLUMN IF EXISTS "longitude";