CREATE TABLE "customers" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"national_id" varchar(11),
	"company_name" varchar(200),
	"tax_number" varchar(20),
	"tax_office" varchar(150),
	"contact_person_name" varchar(150),
	"phone" varchar(20),
	"email" varchar(255),
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_national_id_unique" UNIQUE("national_id"),
	CONSTRAINT "customers_tax_number_unique" UNIQUE("tax_number")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
