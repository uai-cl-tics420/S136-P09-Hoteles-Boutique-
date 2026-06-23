import { db } from "@/db";
import { hotels, hotelImages, reviews, roomTypes, extraServices } from "@/db/schema";
import { eq, ilike, and, or, asc, gte, lte, sql, inArray } from "drizzle-orm";
import type { HotelCategory } from "@/types/domain";

export interface HotelFilters {
  query?: string;
  category?: HotelCategory;
  minStars?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  /** Preferred categories from the user's profile — used to boost relevance ranking */
  preferredCategories?: string[];
  /** Filter hotels that offer a specific extra service category (SPA, DINING, etc.) */
  experienceType?: string;
  country?: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function groupBy<T extends { hotelId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    if (!map.has(row.hotelId)) map.set(row.hotelId, []);
    map.get(row.hotelId)!.push(row);
  }
  return map;
}

// ─── getHotels ────────────────────────────────────────────────────────────────
// Usa db.select() explícito en lugar de db.query.* (relational API) para evitar
// los LATERAL JOINs que son incompatibles con Supabase/PgBouncer (transaction mode).

export async function getHotels(filters: HotelFilters = {}) {
  const { query, category, minStars, maxPrice, page = 1, limit = 12, preferredCategories, experienceType, country } = filters;
  const offset = (page - 1) * limit;

  const conditions = [eq(hotels.active, true)];
  if (query) {
    conditions.push(
      or(
        ilike(hotels.name, `%${query}%`),
        ilike(hotels.locationCity, `%${query}%`),
        ilike(hotels.locationCountry, `%${query}%`)
      )!
    );
  }
  if (category) conditions.push(eq(hotels.category, category));
  if (minStars) conditions.push(gte(hotels.starRating, minStars));
  if (country) conditions.push(ilike(hotels.locationCountry, country));

  if (maxPrice !== undefined) {
    const validHotelIdsQuery = db
      .select({ hotelId: roomTypes.hotelId })
      .from(roomTypes)
      .where(lte(sql`CAST(${roomTypes.pricePerNight} AS NUMERIC)`, maxPrice));
    conditions.push(inArray(hotels.id, validHotelIdsQuery));
  }

  // Filter by experience type (SPA, DINING, etc.) — hotels that have at least one active extra service
  if (experienceType) {
    const hotelsWithExperience = db
      .select({ hotelId: extraServices.hotelId })
      .from(extraServices)
      .where(
        and(
          eq(extraServices.category, experienceType as any),
          eq(extraServices.available, true)
        )
      );
    conditions.push(inArray(hotels.id, hotelsWithExperience));
  }

  // Personalisation: if the user has preferred categories, boost those hotels first.
  // Fallback to alphabetical when no preferences or all equal priority.
  const hotelRows = await (preferredCategories && preferredCategories.length > 0
    ? db
        .select()
        .from(hotels)
        .where(and(...conditions))
        .orderBy(
          sql<number>`CASE WHEN ${hotels.category} IN (${sql.join(
            preferredCategories.map((c) => sql`${c}`),
            sql`, `
          )}) THEN 0 ELSE 1 END`,
          asc(hotels.name)
        )
        .limit(limit)
        .offset(offset)
    : db
        .select()
        .from(hotels)
        .where(and(...conditions))
        .orderBy(asc(hotels.name))
        .limit(limit)
        .offset(offset));


  if (hotelRows.length === 0) return [];

  const hotelIds = hotelRows.map((h) => h.id);

  // 2. Imágenes, tipos de habitación y ratings en paralelo (sin N+1, sin LATERAL)
  const [imageRows, roomTypeRows, ratingRows] = await Promise.all([
    db
      .select()
      .from(hotelImages)
      .where(inArray(hotelImages.hotelId, hotelIds))
      .orderBy(asc(hotelImages.sortOrder)),

    db
      .select()
      .from(roomTypes)
      .where(inArray(roomTypes.hotelId, hotelIds)),

    db
      .select({
        hotelId:    reviews.hotelId,
        avg:        sql<string>`ROUND(AVG(${reviews.ratingOverall})::numeric, 1)`,
        avgService: sql<string>`ROUND(AVG(${reviews.ratingService})::numeric, 1)`,
      })
      .from(reviews)
      .where(inArray(reviews.hotelId, hotelIds))
      .groupBy(reviews.hotelId),
  ]);

  // 3. Agrupar por hotelId en memoria
  const imagesMap    = groupBy(imageRows);
  const roomTypesMap = groupBy(roomTypeRows);
  const ratingMap    = new Map(ratingRows.map((r) => [r.hotelId, r]));

  return hotelRows.map((hotel) => {
    const hotelRoomTypes   = roomTypesMap.get(hotel.id) ?? [];
    const minPricePerNight =
      hotelRoomTypes.length > 0
        ? Math.min(...hotelRoomTypes.map((rt) => parseFloat(rt.pricePerNight)))
        : null;

    const ratingRow = ratingMap.get(hotel.id);
    return {
      ...hotel,
      images:            imagesMap.get(hotel.id) ?? [],
      roomTypes:         hotelRoomTypes,
      minPricePerNight,
      avgRating:  ratingRow?.avg        ? parseFloat(ratingRow.avg)        : null,
      avgService: ratingRow?.avgService ? parseFloat(ratingRow.avgService) : null,
    };
  });
}


// ─── getHotelBySlug ───────────────────────────────────────────────────────────

export async function getHotelBySlug(slug: string) {
  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.slug, slug))
    .limit(1);

  if (!hotel) return null;

  const [imageRows, roomTypeRows, extraRows] = await Promise.all([
    db
      .select()
      .from(hotelImages)
      .where(eq(hotelImages.hotelId, hotel.id))
      .orderBy(asc(hotelImages.sortOrder)),
    db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.hotelId, hotel.id)),
    db
      .select()
      .from(extraServices)
      .where(eq(extraServices.hotelId, hotel.id)),
  ]);

  return {
    ...hotel,
    images:        imageRows,
    roomTypes:     roomTypeRows,
    extraServices: extraRows,
  };
}


// ─── getHotelById ─────────────────────────────────────────────────────────────

export async function getHotelById(id: string) {
  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, id))
    .limit(1);

  if (!hotel) return null;

  const [imageRows, roomTypeRows] = await Promise.all([
    db
      .select()
      .from(hotelImages)
      .where(eq(hotelImages.hotelId, hotel.id))
      .orderBy(asc(hotelImages.sortOrder)),
    db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.hotelId, hotel.id)),
  ]);

  return {
    ...hotel,
    images:    imageRows,
    roomTypes: roomTypeRows,
  };
}


// ─── getHotelsByOwner ─────────────────────────────────────────────────────────

export async function getHotelsByOwner(ownerId: string) {
  const hotelRows = await db
    .select()
    .from(hotels)
    .where(eq(hotels.ownerId, ownerId))
    .orderBy(asc(hotels.name));

  if (hotelRows.length === 0) return [];

  const hotelIds = hotelRows.map((h) => h.id);

  const [imageRows, roomTypeRows] = await Promise.all([
    db
      .select()
      .from(hotelImages)
      .where(inArray(hotelImages.hotelId, hotelIds))
      .orderBy(asc(hotelImages.sortOrder)),
    db
      .select()
      .from(roomTypes)
      .where(inArray(roomTypes.hotelId, hotelIds)),
  ]);

  const imagesMap    = groupBy(imageRows);
  const roomTypesMap = groupBy(roomTypeRows);

  return hotelRows.map((hotel) => ({
    ...hotel,
    images:    imagesMap.get(hotel.id)    ?? [],
    roomTypes: roomTypesMap.get(hotel.id) ?? [],
  }));
}
