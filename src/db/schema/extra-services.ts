import { pgTable, uuid, varchar, text, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { hotels } from "./hotels";

export const extraCategoryEnum = pgEnum("extra_category", [
  "SPA",
  "DINING",
  "TRANSPORT",
  "EXPERIENCE",
  "OTHER",
]);

export const extraServices = pgTable("extra_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("CLP"),
  category: extraCategoryEnum("category").notNull().default("OTHER"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});