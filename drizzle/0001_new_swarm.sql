ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
UPDATE "users" SET "phone" = 'legacy_' || "id" WHERE "phone" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_unique" UNIQUE("phone");
