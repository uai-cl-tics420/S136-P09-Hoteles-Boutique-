import { pgTable, uuid, integer, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const guestPreferences = pgTable("guest_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredCategories: jsonb("preferred_categories").$type<string[]>().default([]),
  preferredAmenities: jsonb("preferred_amenities").$type<string[]>().default([]),
  preferredLocation: varchar("preferred_location", { length: 255 }),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});