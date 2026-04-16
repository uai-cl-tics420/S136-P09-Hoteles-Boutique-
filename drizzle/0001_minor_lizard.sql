CREATE TYPE "public"."user_role" AS ENUM('GUEST', 'HOTEL_ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."hotel_category" AS ENUM('LUXURY', 'BOUTIQUE', 'ECO', 'BEACH', 'MOUNTAIN', 'CITY');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."extra_category" AS ENUM('SPA', 'DINING', 'TRANSPORT', 'EXPERIENCE', 'OTHER');--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"location_city" varchar(100) NOT NULL,
	"location_country" varchar(100) NOT NULL,
	"address" varchar(500),
	"latitude" real,
	"longitude" real,
	"category" "hotel_category" DEFAULT 'BOUTIQUE' NOT NULL,
	"star_rating" integer DEFAULT 3 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"capacity" integer DEFAULT 2 NOT NULL,
	"price_per_night" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CLP' NOT NULL,
	"total_rooms" integer DEFAULT 1 NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"date" date NOT NULL,
	"rooms_available" integer NOT NULL,
	"price_override" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "availability_room_type_id_date_unique" UNIQUE("room_type_id","date")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guests_count" integer DEFAULT 1 NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'CLP' NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"special_requests" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"extra_service_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extra_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CLP' NOT NULL,
	"category" "extra_category" DEFAULT 'OTHER' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"hotel_id" uuid NOT NULL,
	"rating_overall" integer NOT NULL,
	"rating_service" integer NOT NULL,
	"rating_cleanliness" integer NOT NULL,
	"rating_location" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"url" varchar(1000) NOT NULL,
	"alt_text" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"preferred_categories" jsonb DEFAULT '[]'::jsonb,
	"preferred_amenities" jsonb DEFAULT '[]'::jsonb,
	"preferred_location" varchar(255),
	"budget_min" integer,
	"budget_max" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guest_preferences_guest_id_unique" UNIQUE("guest_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_secret" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_enabled" varchar(5) DEFAULT 'false';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sso_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sso_subject" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'GUEST' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" varchar(10) DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_extra_service_id_extra_services_id_fk" FOREIGN KEY ("extra_service_id") REFERENCES "public"."extra_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_services" ADD CONSTRAINT "extra_services_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_preferences" ADD CONSTRAINT "guest_preferences_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";