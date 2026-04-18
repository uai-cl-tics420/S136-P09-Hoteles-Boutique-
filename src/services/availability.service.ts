import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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
  const existing = await db.query.availability.findFirst({
    where: and(eq(availability.roomTypeId, roomTypeId), eq(availability.date, date)),
  });

  if (existing) {
    const [updated] = await db
      .update(availability)
      .set({ roomsAvailable, priceOverride: priceOverride ?? null })
      .where(eq(availability.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(availability)
    .values({ roomTypeId, date, roomsAvailable, priceOverride: priceOverride ?? null })
    .returning();
  return created;
}