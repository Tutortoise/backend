ALTER TABLE "subjects" RENAME TO "categories";--> statement-breakpoint
ALTER TABLE "interests" RENAME COLUMN "subjectId" TO "categoryId";--> statement-breakpoint
ALTER TABLE "tutories" RENAME COLUMN "subjectId" TO "categoryId";--> statement-breakpoint
ALTER TABLE "interests" DROP CONSTRAINT "interests_subjectId_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "tutories" DROP CONSTRAINT "tutories_subjectId_subjects_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "tutories_tutorId_subjectId_index";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interests" ADD CONSTRAINT "interests_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutories" ADD CONSTRAINT "tutories_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutories_tutorId_categoryId_index" ON "tutories" USING btree ("tutorId","categoryId");