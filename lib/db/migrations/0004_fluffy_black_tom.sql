CREATE TABLE "flowpro_customer_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"agency_key" varchar(255) NOT NULL,
	"simpro_customer_id" integer NOT NULL,
	"customer_name" varchar(255),
	"source" varchar(20) NOT NULL,
	"times_used" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flowpro_customer_map_agency_key_unique" UNIQUE("agency_key")
);
--> statement-breakpoint
CREATE TABLE "flowpro_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"simpro_customer_id" integer NOT NULL,
	"type" varchar(20),
	"company_name" varchar(255),
	"given_name" varchar(120),
	"family_name" varchar(120),
	"email_domains" jsonb,
	"raw_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flowpro_customers_simpro_customer_id_unique" UNIQUE("simpro_customer_id")
);
--> statement-breakpoint
CREATE TABLE "flowpro_site_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"address_key" varchar(300) NOT NULL,
	"simpro_site_id" integer NOT NULL,
	"simpro_site_name" varchar(255),
	"simpro_customer_id" integer,
	"simpro_customer_name" varchar(255),
	"source" varchar(20) NOT NULL,
	"confidence" numeric(4, 3),
	"last_ref" varchar(50),
	"times_used" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flowpro_site_map_address_key_unique" UNIQUE("address_key")
);
--> statement-breakpoint
CREATE TABLE "flowpro_sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"simpro_site_id" integer NOT NULL,
	"name" text NOT NULL,
	"address_line" text,
	"city" varchar(120),
	"state" varchar(60),
	"postcode" varchar(20),
	"country" varchar(80),
	"customer_ids" jsonb,
	"archived" boolean DEFAULT false NOT NULL,
	"address_key" varchar(300),
	"raw_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flowpro_sites_simpro_site_id_unique" UNIQUE("simpro_site_id")
);
--> statement-breakpoint
ALTER TABLE "flowpro_customer_map" ADD CONSTRAINT "flowpro_customer_map_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flowpro_customers" ADD CONSTRAINT "flowpro_customers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flowpro_site_map" ADD CONSTRAINT "flowpro_site_map_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flowpro_sites" ADD CONSTRAINT "flowpro_sites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flowpro_customer_map_customer_idx" ON "flowpro_customer_map" USING btree ("simpro_customer_id");--> statement-breakpoint
CREATE INDEX "flowpro_customers_team_idx" ON "flowpro_customers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "flowpro_site_map_site_idx" ON "flowpro_site_map" USING btree ("simpro_site_id");--> statement-breakpoint
CREATE INDEX "flowpro_sites_team_idx" ON "flowpro_sites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "flowpro_sites_address_key_idx" ON "flowpro_sites" USING btree ("address_key");