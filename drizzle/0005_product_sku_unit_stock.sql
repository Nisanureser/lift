ALTER TABLE "products" ADD COLUMN "sku" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_quantity" numeric(12, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "products" SET "sku" = 'SKU-' || "id", "unit" = 'piece' WHERE "sku" IS NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sku" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "unit" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_unique" UNIQUE("sku");--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"product_id" varchar(128) NOT NULL,
	"type" varchar(20) NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"previous_stock" numeric(12, 3) NOT NULL,
	"new_stock" numeric(12, 3) NOT NULL,
	"note" text,
	"created_by" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
