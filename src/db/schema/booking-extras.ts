import { pgTable, uuid, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { extraServices } from "./extra-services";

export const bookingExtras = pgTable("booking_extras", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  extraServiceId: uuid("extra_service_id")
    .notNull()
    .references(() => extraServices.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});