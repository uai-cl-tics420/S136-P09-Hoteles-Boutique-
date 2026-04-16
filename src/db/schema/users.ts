import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "GUEST",
  "HOTEL_ADMIN",
  "SUPER_ADMIN",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  otpSecret: varchar("otp_secret", { length: 500 }),
  otpEnabled: varchar("otp_enabled", { length: 5 }).default("false"),
  ssoProvider: varchar("sso_provider", { length: 50 }),
  ssoSubject: varchar("sso_subject", { length: 255 }),
  role: userRoleEnum("role").notNull().default("GUEST"),
  locale: varchar("locale", { length: 10 }).notNull().default("es"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});