ALTER TABLE "tutories" ALTER COLUMN "type_lesson" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tutories" ADD COLUMN "name" varchar(50) NOT NULL;