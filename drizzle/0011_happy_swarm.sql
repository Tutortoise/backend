ALTER TABLE "tutories" ADD COLUMN "is_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tutories" DROP COLUMN IF EXISTS "is_disabled";