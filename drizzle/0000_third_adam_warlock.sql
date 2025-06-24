CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"whatsapp_conversation_id" varchar(100),
	"status" varchar(20) DEFAULT 'active',
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid,
	"whatsapp_media_id" varchar(100),
	"original_url" text,
	"stored_url" text,
	"file_name" text,
	"mime_type" varchar(100),
	"file_size" integer,
	"sha256" varchar(64),
	"upload_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "message_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"recipient_id" varchar(50),
	"conversation_info" jsonb,
	"pricing_info" jsonb,
	"error" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"whatsapp_message_id" varchar(100),
	"direction" varchar(10) NOT NULL,
	"message_type" varchar(20) NOT NULL,
	"content" text,
	"media_url" text,
	"media_type" varchar(50),
	"file_name" text,
	"caption" text,
	"location" jsonb,
	"contacts" jsonb,
	"interactive" jsonb,
	"context" jsonb,
	"status" varchar(20) DEFAULT 'sent',
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"error" text,
	CONSTRAINT "messages_whatsapp_message_id_unique" UNIQUE("whatsapp_message_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"whatsapp_id" varchar(50) NOT NULL,
	"phone_number" varchar(20),
	"profile_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_blocked" boolean DEFAULT false,
	"metadata" jsonb,
	CONSTRAINT "users_whatsapp_id_unique" UNIQUE("whatsapp_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" varchar(10) NOT NULL,
	"source" varchar(50),
	"message" text,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"processing_time_ms" integer,
	"error" text,
	"stack" text
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_statuses" ADD CONSTRAINT "message_statuses_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_last_message_at_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "media_files_message_id_idx" ON "media_files" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "media_files_whatsapp_media_id_idx" ON "media_files" USING btree ("whatsapp_media_id");--> statement-breakpoint
CREATE INDEX "media_files_upload_status_idx" ON "media_files" USING btree ("upload_status");--> statement-breakpoint
CREATE INDEX "message_statuses_message_id_idx" ON "message_statuses" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_statuses_status_idx" ON "message_statuses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_statuses_timestamp_idx" ON "message_statuses" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_whatsapp_message_id_idx" ON "messages" USING btree ("whatsapp_message_id");--> statement-breakpoint
CREATE INDEX "messages_direction_idx" ON "messages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "messages_message_type_idx" ON "messages" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_timestamp_idx" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "users_whatsapp_id_idx" ON "users" USING btree ("whatsapp_id");--> statement-breakpoint
CREATE INDEX "users_phone_number_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "webhook_logs_level_idx" ON "webhook_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "webhook_logs_timestamp_idx" ON "webhook_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "webhook_logs_source_idx" ON "webhook_logs" USING btree ("source");