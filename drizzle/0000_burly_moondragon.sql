CREATE TABLE "contact" (
	"id" integer PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"linkedin_url" text,
	"github_url" text,
	CONSTRAINT "contact_singleton" CHECK ("contact"."id" = 1),
	CONSTRAINT "contact_whatsapp_format" CHECK ("contact"."whatsapp" ~ '^\+\d{8,15}$')
);
--> statement-breakpoint
CREATE TABLE "content_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_state_singleton" CHECK ("content_state"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "experience" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "experience_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company" text NOT NULL,
	"role_en" text NOT NULL,
	"role_es" text,
	"start_month" date NOT NULL,
	"end_month" date,
	"location_en" text NOT NULL,
	"location_es" text,
	"achievements" jsonb NOT NULL,
	"technologies" text[] NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "experience_end_after_start" CHECK ("experience"."end_month" IS NULL OR "experience"."end_month" >= "experience"."start_month")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title_en" text NOT NULL,
	"title_es" text,
	"slogan_en" text NOT NULL,
	"slogan_es" text,
	"headline_en" text,
	"headline_es" text,
	"summary_en" text NOT NULL,
	"summary_es" text,
	"mission_en" text NOT NULL,
	"mission_es" text,
	"vision_en" text NOT NULL,
	"vision_es" text,
	CONSTRAINT "profile_singleton" CHECK ("profile"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "profile_values" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "profile_values_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title_en" text NOT NULL,
	"title_es" text,
	"description_en" text NOT NULL,
	"description_es" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title_en" text NOT NULL,
	"title_es" text,
	"description_en" text NOT NULL,
	"description_es" text,
	"technologies" text[] NOT NULL,
	"demo_url" text,
	"code_url" text,
	"image_url" text,
	"image_alt_en" text,
	"image_alt_es" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "projects_status_valid" CHECK ("projects"."status" IN ('draft', 'published')),
	CONSTRAINT "projects_image_has_alt" CHECK ("projects"."image_url" IS NULL OR "projects"."image_alt_en" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skill_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name_en" text NOT NULL,
	"name_es" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "skills_category_name_unique" ON "skills" USING btree ("category_id",lower("name"));