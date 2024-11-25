CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"orderId" uuid NOT NULL,
	"rating" integer NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
