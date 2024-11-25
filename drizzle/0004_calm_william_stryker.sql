CREATE TABLE IF NOT EXISTS "interests" (
	"learnerId" uuid NOT NULL,
	"subjectId" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interests" ADD CONSTRAINT "interests_learnerId_learners_id_fk" FOREIGN KEY ("learnerId") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interests" ADD CONSTRAINT "interests_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
