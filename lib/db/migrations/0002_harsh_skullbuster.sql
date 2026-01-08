ALTER TABLE "work_orders" ADD COLUMN "tapi_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "tapi_accepted_at" timestamp;