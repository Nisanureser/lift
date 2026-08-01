ALTER TABLE "customers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_national_id_unique";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_tax_number_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "customers_national_id_active_unique" ON "customers" ("national_id") WHERE "deleted_at" IS NULL AND "national_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tax_number_active_unique" ON "customers" ("tax_number") WHERE "deleted_at" IS NULL AND "tax_number" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_active_unique" ON "categories" ("name") WHERE "deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_sku_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_active_unique" ON "products" ("sku") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE "elevators" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"site_id" varchar(128) NOT NULL,
	"label" varchar(200) NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"capacity" varchar(50),
	"installed_at" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(128),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "elevators" ADD CONSTRAINT "elevators_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevators" ADD CONSTRAINT "elevators_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "elevators_serial_number_active_unique" ON "elevators" ("serial_number") WHERE "deleted_at" IS NULL AND "serial_number" IS NOT NULL;
