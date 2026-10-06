CREATE TABLE "message_template" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stage_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_template_org_stage_uq" UNIQUE NULLS NOT DISTINCT("organization_id","stage_id")
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"time_zone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_template" ADD CONSTRAINT "message_template_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_template" ADD CONSTRAINT "message_template_stage_id_pipeline_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;