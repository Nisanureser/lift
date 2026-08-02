CREATE TABLE "contracts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"customer_id" varchar(128) NOT NULL,
	"site_id" varchar(128),
	"elevator_id" varchar(128),
	"type" varchar(30) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"visit_frequency" varchar(20) NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(128),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"elevator_id" varchar(128) NOT NULL,
	"assigned_to" varchar(128),
	"contract_id" varchar(128),
	"type" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"priority" varchar(10) DEFAULT 'normal' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"description" text,
	"internal_notes" text,
	"created_by" varchar(128),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"work_order_id" varchar(128),
	"elevator_id" varchar(128) NOT NULL,
	"arrived_at" timestamp,
	"left_at" timestamp,
	"summary" text,
	"work_performed" text,
	"checklist" jsonb,
	"result" varchar(20) DEFAULT 'ok' NOT NULL,
	"follow_up_notes" text,
	"created_by" varchar(128),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_log_photos" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"service_log_id" varchar(128) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "service_parts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"service_log_id" varchar(128) NOT NULL,
	"product_id" varchar(128) NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_elevator_id_elevators_id_fk" FOREIGN KEY ("elevator_id") REFERENCES "public"."elevators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_elevator_id_elevators_id_fk" FOREIGN KEY ("elevator_id") REFERENCES "public"."elevators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_elevator_id_elevators_id_fk" FOREIGN KEY ("elevator_id") REFERENCES "public"."elevators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_log_photos" ADD CONSTRAINT "service_log_photos_service_log_id_service_logs_id_fk" FOREIGN KEY ("service_log_id") REFERENCES "public"."service_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_service_log_id_service_logs_id_fk" FOREIGN KEY ("service_log_id") REFERENCES "public"."service_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
