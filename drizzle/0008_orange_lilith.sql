ALTER TABLE "tutors" ADD COLUMN "availability" jsonb;--> statement-breakpoint
ALTER TABLE "tutories" DROP COLUMN IF EXISTS "availability";