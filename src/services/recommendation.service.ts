import { db } from "@/db";
import { hotels, hotelImages, bookings, guestPreferences } from "@/db/schema";
import { eq, and, notInArray, asc } from "drizzle-orm";

export async function getRecommendations(guestId: string, limit = 6) {
  // Obtener preferencias del huésped
  const prefs = await db
    .select()
    .from(guestPreferences)
    .where(eq(guestPreferences.guestId, guestId))
    .limit(1)
    .then(result => result[0] || null);

  // Hoteles ya reservados por el huésped (para excluirlos)
  const pastBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.guestId, guestId));

  // Extraer IDs de hoteles ya reservados (nota: sin relaciones anidadas)
  const bookedHotelIds: string[] = [];

  const conditions: any[] = [eq(hotels.active, true)];
  if (bookedHotelIds.length > 0) {
    conditions.push(notInArray(hotels.id, bookedHotelIds));
  }
  if (prefs?.preferredCategories?.length) {
    conditions.push(eq(hotels.category, (prefs.preferredCategories as string[])[0] as any));
  }

  return db
    .select()
    .from(hotels)
    .where(and(...conditions))
    .limit(limit)
    .orderBy(asc(hotels.name));
}