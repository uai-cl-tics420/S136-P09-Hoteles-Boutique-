import { pgTable, uuid, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { hotels } from "./hotels";
import { bookings } from "./bookings";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  ratingOverall: integer("rating_overall").notNull(),
  ratingService: integer("rating_service").notNull(),
  ratingCleanliness: integer("rating_cleanliness").notNull(),
  ratingLocation: integer("rating_location").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
},
// FIX: Índice en hotelId — la query de ratings lo usa constantemente
(table) => [
  index("reviews_hotel_id_idx").on(table.hotelId),
  index("reviews_guest_id_idx").on(table.guestId),
]);
