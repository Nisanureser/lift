CREATE TABLE IF NOT EXISTS "orders" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "payment_method_id" varchar(30) NOT NULL,
  "status" varchar(20) DEFAULT 'tamamlandi' NOT NULL,
  "total" numeric(12, 2) NOT NULL,
  "customer_note" text,
  "created_by" varchar(128),
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "product_id" varchar(128) NOT NULL,
  "product_name" varchar(200) NOT NULL,
  "unit_price" numeric(12, 2) NOT NULL,
  "quantity" numeric(12, 3) NOT NULL,
  "line_total" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_movements" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "type" varchar(30) NOT NULL,
  "label" varchar(120) NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_payments" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "note" text,
  "created_by" varchar(128),
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "order_movements" ADD CONSTRAINT "order_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
