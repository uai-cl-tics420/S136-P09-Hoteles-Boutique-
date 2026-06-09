ALTER TABLE "hotels" ADD COLUMN "google_place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "google_rating" real;--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "google_rating_count" integer;--> statement-breakpoint
CREATE INDEX "hotels_active_idx" ON "hotels" USING btree ("active");--> statement-breakpoint
CREATE INDEX "hotels_city_idx" ON "hotels" USING btree ("location_city");--> statement-breakpoint
CREATE INDEX "hotels_category_idx" ON "hotels" USING btree ("category");--> statement-breakpoint
CREATE INDEX "hotels_star_rating_idx" ON "hotels" USING btree ("star_rating");--> statement-breakpoint
CREATE INDEX "hotels_owner_idx" ON "hotels" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "bookings_guest_id_idx" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "bookings_room_type_id_idx" ON "bookings" USING btree ("room_type_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_hotel_id_idx" ON "reviews" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX "reviews_guest_id_idx" ON "reviews" USING btree ("guest_id");