import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { hotels } from "./hotels";

export const hotelImages = pgTable("hotel_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1000 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isCover: boolean("is_cover").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});