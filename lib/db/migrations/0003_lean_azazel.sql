ALTER TABLE "work_orders" ADD COLUMN "sms_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "sms_sid" varchar(100);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "sms_status" varchar(50);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "sms_sent_at" timestamp;