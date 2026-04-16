import { pgTable, uuid, varchar, text, decimal, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { hotels } from "./hotels";

export const roomTypes = pgTable("room_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull().default(2),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("CLP"),
  totalRooms: integer("total_rooms").notNull().default(1),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});