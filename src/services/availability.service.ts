import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function getAvailability(roomTypeId: string, from: string, to: string) {
  return db.query.availability.findMany({
    where: and(
      eq(availability.roomTypeId, roomTypeId),
      gte(availability.date, from),
      lte(availability.date, to)
    ),
    orderBy: (a, { asc }) => [asc(a.date)],
  });
}

export async function setAvailability(
  roomTypeId: string,
  date: string,
  roomsAvailable: number,
  priceOverride?: string
) {
  // Upsert atómico: una sola query en vez de SELECT + UPDATE/INSERT separados.
  // ON CONFLICT garantiza que no hay race condition con requests concurrentes.
  const [result] = await db
    .insert(availability)
    .values({ roomTypeId, date, roomsAvailable, priceOverride: priceOverride ?? null })
    .onConflictDoUpdate({
      target: [availability.roomTypeId, availability.date],
      set: {
        roomsAvailable,
        priceOverride: priceOverride ?? null,
      },
    })
    .returning();
  return result;
}