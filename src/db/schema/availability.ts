import { pgTable, uuid, date, integer, decimal, timestamp, unique } from "drizzle-orm/pg-core";
import { roomTypes } from "./room-types";

export const availability = pgTable(
  "availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    roomsAvailable: integer("rooms_available").notNull(),
    priceOverride: decimal("price_override", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // cada room_type solo puede tener un registro por fecha
    uniqueRoomDate: unique().on(table.roomTypeId, table.date),
  })
);