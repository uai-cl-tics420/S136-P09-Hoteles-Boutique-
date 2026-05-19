import { db } from "@/db";
import { hotels, bookings, roomTypes, guestPreferences } from "@/db/schema";
import { eq, and, notInArray, asc, inArray } from "drizzle-orm";
import { redis } from "@/lib/redis/client";

const CACHE_TTL = 600; // 10 minutos

export async function getRecommendations(guestId: string, limit = 6) {
  const cacheKey = `recommendations:${guestId}:${limit}`;

  // Intentar leer desde caché Redis primero
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Si Redis falla, continuar sin caché
  }

  // Obtener preferencias del huésped
  const prefs = await db
    .select()
    .from(guestPreferences)
    .where(eq(guestPreferences.guestId, guestId))
    .limit(1)
    .then((result) => result[0] || null);

  // Hoteles ya reservados por el huésped (para excluirlos)
  // FIX: Se extrae el hotelId de cada reserva via roomType
  const pastBookingRows = await db
    .select({ roomTypeId: bookings.roomTypeId })
    .from(bookings)
    .where(eq(bookings.guestId, guestId));

  // Obtener los hotelIds a partir de los roomTypeIds reservados
  let bookedHotelIds: string[] = [];
  if (pastBookingRows.length > 0) {
    const roomTypeIds = pastBookingRows.map((b) => b.roomTypeId);
    const roomTypeRows = await db
      .select({ hotelId: roomTypes.hotelId })
      .from(roomTypes)
      .where(inArray(roomTypes.id, roomTypeIds));
    bookedHotelIds = [...new Set(roomTypeRows.map((r) => r.hotelId))];
  }

  const conditions: any[] = [eq(hotels.active, true)];
  if (bookedHotelIds.length > 0) {
    conditions.push(notInArray(hotels.id, bookedHotelIds));
  }
  if (prefs?.preferredCategories?.length) {
    conditions.push(eq(hotels.category, (prefs.preferredCategories as string[])[0] as any));
  }

  const result = await db
    .select()
    .from(hotels)
    .where(and(...conditions))
    .limit(limit)
    .orderBy(asc(hotels.name));

  // Guardar en Redis
  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  } catch {
    // Silenciar errores de Redis — la app sigue funcionando
  }

  return result;
}