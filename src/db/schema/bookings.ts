import { pgTable, uuid, date, integer, decimal, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { roomTypes } from "./room-types";

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  roomTypeId: uuid("room_type_id")
    .notNull()
    .references(() => roomTypes.id, { onDelete: "restrict" }),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  guestsCount: integer("guests_count").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("CLP"),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
},
// FIX: Índices para búsquedas de reservas por huésped y tipo de habitación
(table) => [
  index("bookings_guest_id_idx").on(table.guestId),
  index("bookings_room_type_id_idx").on(table.roomTypeId),
  index("bookings_status_idx").on(table.status),
]);
