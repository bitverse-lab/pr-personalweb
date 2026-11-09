CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "application_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"kind" text NOT NULL,
	"purpose" text DEFAULT 'library' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"school" text NOT NULL,
	"degree" text,
	"field" text,
	"start_date" date,
	"end_date" date,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"location" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"description" text,
	"achievements" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"headline" text,
	"summary" text,
	"location" text,
	"public_email" text,
	"website" text,
	"roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"available_for_work" boolean DEFAULT false NOT NULL,
	"availability_note" text,
	"photo_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"level" integer DEFAULT 80 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subtask" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"email" text,
	"phone" text,
	"linkedin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_timeline_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"status" text DEFAULT 'wishlist' NOT NULL,
	"location" text,
	"work_mode" text,
	"job_url" text,
	"salary_range" text,
	"applied_at" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"application_id" uuid NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"location_or_link" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"contact_id" uuid,
	"calendar_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_measurement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"waist_cm" numeric(5, 1),
	"chest_cm" numeric(5, 1),
	"hips_cm" numeric(5, 1),
	"arm_cm" numeric(5, 1),
	"thigh_cm" numeric(5, 1),
	"neck_cm" numeric(5, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"equipment" text DEFAULT 'other' NOT NULL,
	"kind" text DEFAULT 'strength' NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"serving_size" numeric(7, 2) DEFAULT 100 NOT NULL,
	"serving_unit" text DEFAULT 'g' NOT NULL,
	"calories" numeric(7, 1) NOT NULL,
	"protein" numeric(6, 1) DEFAULT 0 NOT NULL,
	"carbs" numeric(6, 1) DEFAULT 0 NOT NULL,
	"fat" numeric(6, 1) DEFAULT 0 NOT NULL,
	"fiber" numeric(6, 1) DEFAULT 0 NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"height_cm" numeric(5, 1),
	"sex" text,
	"birth_date" date,
	"activity_level" text DEFAULT 'light' NOT NULL,
	"goal_type" text DEFAULT 'maintain' NOT NULL,
	"target_weight_kg" numeric(5, 1),
	"weekly_rate_kg" numeric(4, 2),
	"daily_calories" integer,
	"protein_g" integer,
	"carbs_g" integer,
	"fat_g" integer,
	"water_ml" integer,
	"weekly_workout_target" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "meal_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"meal_id" uuid NOT NULL,
	"food_id" uuid,
	"name" text NOT NULL,
	"servings" numeric(7, 2) DEFAULT 1 NOT NULL,
	"serving_label" text,
	"calories" numeric(8, 1) NOT NULL,
	"protein" numeric(7, 1) DEFAULT 0 NOT NULL,
	"carbs" numeric(7, 1) DEFAULT 0 NOT NULL,
	"fat" numeric(7, 1) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"target_sets" integer DEFAULT 3 NOT NULL,
	"target_reps" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"amount_ml" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"body_fat_pct" numeric(4, 1),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_set" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workout_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"exercise_order" integer NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer,
	"weight_kg" numeric(6, 2),
	"duration_sec" integer,
	"distance_km" numeric(6, 2),
	"is_warmup" boolean DEFAULT false NOT NULL,
	"done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"notes" text,
	"routine_id" uuid,
	"status" text DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_tag" (
	"article_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "article_tag_article_id_tag_id_pk" PRIMARY KEY("article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"cover_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"title" text,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"mood" integer,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"caption" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"summary" text,
	"category" text,
	"client" text,
	"role" text,
	"location" text,
	"start_date" date,
	"end_date" date,
	"technologies" text[] DEFAULT '{}'::text[] NOT NULL,
	"content" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"cover_media_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"ip_hash" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"quote" text NOT NULL,
	"author_name" text NOT NULL,
	"author_role" text,
	"company" text,
	"source_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document" ADD CONSTRAINT "application_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document" ADD CONSTRAINT "application_document_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document" ADD CONSTRAINT "application_document_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_link" ADD CONSTRAINT "social_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtask" ADD CONSTRAINT "subtask_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtask" ADD CONSTRAINT "subtask_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_contact" ADD CONSTRAINT "application_contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_contact" ADD CONSTRAINT "application_contact_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_timeline_event" ADD CONSTRAINT "application_timeline_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_timeline_event" ADD CONSTRAINT "application_timeline_event_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_contact_id_application_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."application_contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_calendar_event_id_calendar_event_id_fk" FOREIGN KEY ("calendar_event_id") REFERENCES "public"."calendar_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurement" ADD CONSTRAINT "body_measurement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food" ADD CONSTRAINT "food_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profile" ADD CONSTRAINT "health_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_item" ADD CONSTRAINT "meal_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_item" ADD CONSTRAINT "meal_item_meal_id_meal_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_item" ADD CONSTRAINT "meal_item_food_id_food_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal" ADD CONSTRAINT "meal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_entry" ADD CONSTRAINT "water_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entry" ADD CONSTRAINT "weight_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_workout_id_workout_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workout"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout" ADD CONSTRAINT "workout_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout" ADD CONSTRAINT "workout_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_tag" ADD CONSTRAINT "article_tag_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_tag" ADD CONSTRAINT "article_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_link" ADD CONSTRAINT "project_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_link" ADD CONSTRAINT "project_link_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message" ADD CONSTRAINT "contact_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_user_created_idx" ON "media" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_user_name_idx" ON "company" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "body_measurement_user_date_idx" ON "body_measurement" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_user_name_idx" ON "exercise" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "food_user_name_idx" ON "food" USING btree ("user_id",lower("name"),coalesce("brand", ''));--> statement-breakpoint
CREATE INDEX "meal_user_date_idx" ON "meal" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "water_entry_user_date_idx" ON "water_entry" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entry_user_date_idx" ON "weight_entry" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "workout_user_date_idx" ON "workout" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "article_user_slug_idx" ON "article" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "article_user_status_idx" ON "article" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_user_date_idx" ON "journal_entry" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_user_name_idx" ON "tag" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "project_user_slug_idx" ON "project" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "project_user_status_idx" ON "project" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "contact_message_user_created_idx" ON "contact_message" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "contact_message_ip_idx" ON "contact_message" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "testimonial_user_position_idx" ON "testimonial" USING btree ("user_id","position");