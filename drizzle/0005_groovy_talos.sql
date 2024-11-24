ALTER TABLE "orders" RENAME COLUMN "tutoryId" TO "tutoriesId";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_tutorId_tutors_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_tutoryId_tutories_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_tutoriesId_tutories_id_fk" FOREIGN KEY ("tutoriesId") REFERENCES "public"."tutories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "tutorId";