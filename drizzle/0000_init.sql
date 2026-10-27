CREATE TABLE "areas" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "confirmations" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"kind" text NOT NULL,
	"visitor_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributors" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"approved" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "contributors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"area_id" text NOT NULL,
	"status" text NOT NULL,
	"version" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisers" (
	"listing_id" text NOT NULL,
	"contributor_id" text NOT NULL,
	CONSTRAINT "organisers_listing_id_contributor_id_pk" PRIMARY KEY("listing_id","contributor_id")
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"version" integer NOT NULL,
	"details" jsonb NOT NULL,
	"changes" jsonb NOT NULL,
	"by" text NOT NULL,
	"contributor_id" text,
	"note" text,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sign_in_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"next" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"area_id" text NOT NULL,
	"listing_id" text,
	"base_version" integer,
	"changes" jsonb NOT NULL,
	"message" text,
	"contributor_id" text NOT NULL,
	"priority" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"review_note" text
);
--> statement-breakpoint
ALTER TABLE "confirmations" ADD CONSTRAINT "confirmations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisers" ADD CONSTRAINT "organisers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisers" ADD CONSTRAINT "organisers_contributor_id_contributors_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_contributor_id_contributors_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "confirmations_listing" ON "confirmations" USING btree ("listing_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_slug" ON "listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "listings_area" ON "listings" USING btree ("area_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "revisions_version" ON "revisions" USING btree ("listing_id","version");--> statement-breakpoint
CREATE INDEX "suggestions_status" ON "suggestions" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "suggestions_contributor" ON "suggestions" USING btree ("contributor_id","created_at");