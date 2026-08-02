ALTER TABLE "service_logs" ADD COLUMN IF NOT EXISTS "labor_cost" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "service_logs" ADD COLUMN IF NOT EXISTS "travel_cost" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "service_logs" ADD COLUMN IF NOT EXISTS "materials_total" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "service_logs" ADD COLUMN IF NOT EXISTS "expenses_total" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "service_logs" ADD COLUMN IF NOT EXISTS "total_cost" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "service_parts" ADD COLUMN IF NOT EXISTS "unit_price" numeric(12, 2);
ALTER TABLE "service_parts" ADD COLUMN IF NOT EXISTS "line_total" numeric(12, 2);

CREATE TABLE IF NOT EXISTS "service_expenses" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "service_log_id" varchar(128) NOT NULL REFERENCES "service_logs"("id") ON DELETE cascade,
  "label" varchar(200) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
