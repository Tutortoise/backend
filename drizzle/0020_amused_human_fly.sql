ALTER TABLE "chat_messages" RENAME COLUMN "roomId" TO "room_id";--> statement-breakpoint
ALTER TABLE "chat_messages" RENAME COLUMN "senderId" TO "sender_id";--> statement-breakpoint
ALTER TABLE "chat_rooms" RENAME COLUMN "learnerId" TO "learner_id";--> statement-breakpoint
ALTER TABLE "chat_rooms" RENAME COLUMN "tutorId" TO "tutor_id";--> statement-breakpoint
ALTER TABLE "fcm_tokens" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "interests" RENAME COLUMN "learnerId" TO "learner_id";--> statement-breakpoint
ALTER TABLE "interests" RENAME COLUMN "categoryId" TO "category_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "learnerId" TO "learner_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "tutoriesId" TO "tutories_id";--> statement-breakpoint
ALTER TABLE "reviews" RENAME COLUMN "orderId" TO "order_id";--> statement-breakpoint
ALTER TABLE "tutories" RENAME COLUMN "tutorId" TO "tutor_id";--> statement-breakpoint
ALTER TABLE "tutories" RENAME COLUMN "categoryId" TO "category_id";--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderId_unique";--> statement-breakpoint
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_roomId_chat_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_learnerId_learners_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_tutorId_tutors_id_fk";
--> statement-breakpoint
ALTER TABLE "interests" DROP CONSTRAINT "interests_learnerId_learners_id_fk";
--> statement-breakpoint
ALTER TABLE "interests" DROP CONSTRAINT "interests_categoryId_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_learnerId_learners_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_tutoriesId_tutories_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderId_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "tutories" DROP CONSTRAINT "tutories_tutorId_tutors_id_fk";
--> statement-breakpoint
ALTER TABLE "tutories" DROP CONSTRAINT "tutories_categoryId_categories_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "fcm_tokens_userId_token_index";--> statement-breakpoint
DROP INDEX IF EXISTS "fcm_tokens_userId_index";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_learnerId_index";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_tutoriesId_index";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_learnerId_status_index";--> statement-breakpoint
DROP INDEX IF EXISTS "tutories_tutorId_categoryId_index";--> statement-breakpoint
DROP INDEX IF EXISTS "chat_messages_room_sent_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "chat_messages_sender_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interests" ADD CONSTRAINT "interests_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interests" ADD CONSTRAINT "interests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_tutories_id_tutories_id_fk" FOREIGN KEY ("tutories_id") REFERENCES "public"."tutories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutories" ADD CONSTRAINT "tutories_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tutories" ADD CONSTRAINT "tutories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fcm_tokens_user_id_token_index" ON "fcm_tokens" USING btree ("user_id","token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fcm_tokens_user_id_index" ON "fcm_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_learner_id_index" ON "orders" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tutories_id_index" ON "orders" USING btree ("tutories_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_learner_id_status_index" ON "orders" USING btree ("learner_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutories_tutor_id_category_id_index" ON "tutories" USING btree ("tutor_id","category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_room_sent_idx" ON "chat_messages" USING btree ("room_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_unique" UNIQUE("order_id");