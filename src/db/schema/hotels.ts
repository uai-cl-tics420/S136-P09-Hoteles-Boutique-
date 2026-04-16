import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { users } from "./users";

export const hotelCategoryEnum = pgEnum("hotel_category", [
  "LUXURY",
  "BOUTIQUE",
  "ECO",
  "BEACH",
  "MOUNTAIN",
  "CITY",
]);

export const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  locationCity: varchar("location_city", { length: 100 }).notNull(),
  locationCountry: varchar("location_country", { length: 100 }).notNull(),
  address: varchar("address", { length: 500 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  category: hotelCategoryEnum("category").notNull().default("BOUTIQUE"),
  starRating: integer("star_rating").notNull().default(3),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});