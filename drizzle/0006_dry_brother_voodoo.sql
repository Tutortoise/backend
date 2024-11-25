CREATE INDEX IF NOT EXISTS "chat_messages_room_sent_idx" ON "chat_messages" USING btree ("roomId","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_sender_idx" ON "chat_messages" USING btree ("senderId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fcm_tokens_userId_token_index" ON "fcm_tokens" USING btree ("userId","token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fcm_tokens_userId_index" ON "fcm_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_learnerId_index" ON "orders" USING btree ("learnerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tutoriesId_index" ON "orders" USING btree ("tutoriesId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_index" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_session_time_index" ON "orders" USING btree ("session_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_created_at_index" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_learnerId_status_index" ON "orders" USING btree ("learnerId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_rating_index" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_created_at_index" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutories_hourly_rate_index" ON "tutories" USING btree ("hourly_rate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutories_type_lesson_index" ON "tutories" USING btree ("type_lesson");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutories_created_at_index" ON "tutories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutories_tutorId_subjectId_index" ON "tutories" USING btree ("tutorId","subjectId");