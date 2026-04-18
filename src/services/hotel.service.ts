import { db } from "@/db";
import { hotels, reviews } from "@/db/schema";
import { eq, ilike, and, asc, gte, sql } from "drizzle-orm";
import type { HotelCategory } from "@/types/domain";

export interface HotelFilters {
  city?: string;
  category?: HotelCategory;
  minStars?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export async function getHotels(filters: HotelFilters = {}) {
  const { city, category, minStars, maxPrice, page = 1, limit = 12 } = filters;
  const offset = (page - 1) * limit;

  const conditions = [eq(hotels.active, true)];
  if (city)     conditions.push(ilike(hotels.locationCity, `%${city}%`));
  if (category) conditions.push(eq(hotels.category, category));
  if (minStars) conditions.push(gte(hotels.starRating, minStars));

  const hotelRows = await db.query.hotels.findMany({
    where: and(...conditions),
    with: {
      images:    { orderBy: (img, { asc }) => [asc(img.sortOrder)] },
      roomTypes: true,
    },
    limit,
    offset,
    orderBy: [asc(hotels.name)],
  });

  const enriched = await Promise.all(
    hotelRows.map(async (hotel) => {
      const minPricePerNight =
        hotel.roomTypes.length > 0
          ? Math.min(...hotel.roomTypes.map((rt) => parseFloat(rt.pricePerNight)))
          : null;

      // Filtro de precio máximo: descartamos si ninguna habitación entra en presupuesto
      if (maxPrice !== undefined && minPricePerNight !== null && minPricePerNight > maxPrice) {
        return null;
      }

      const [ratingRow] = await db
        .select({
          avg:        sql<string>`ROUND(AVG(${reviews.ratingOverall})::numeric, 1)`,
          avgService: sql<string>`ROUND(AVG(${reviews.ratingService})::numeric, 1)`,
        })
        .from(reviews)
        .where(eq(reviews.hotelId, hotel.id));

      return {
        ...hotel,
        minPricePerNight,
        avgRating:  ratingRow?.avg        ? parseFloat(ratingRow.avg)        : null,
        avgService: ratingRow?.avgService ? parseFloat(ratingRow.avgService) : null,
      };
    })
  );

  return enriched.filter((h) => h !== null);
}

export async function getHotelBySlug(slug: string) {
  const result = await db.query.hotels.findFirst({
    where: eq(hotels.slug, slug),
    with: {
      images:    { orderBy: (img, { asc }) => [asc(img.sortOrder)] },
      roomTypes: true,
    },
  });
  return result ?? null;
}

export async function getHotelById(id: string) {
  const result = await db.query.hotels.findFirst({
    where: eq(hotels.id, id),
    with: {
      images:    { orderBy: (img, { asc }) => [asc(img.sortOrder)] },
      roomTypes: true,
    },
  });
  return result ?? null;
}

export async function getHotelsByOwner(ownerId: string) {
  return db.query.hotels.findMany({
    where: eq(hotels.ownerId, ownerId),
    with: {
      images:    { orderBy: (img, { asc }) => [asc(img.sortOrder)] },
      roomTypes: true,
    },
    orderBy: [asc(hotels.name)],
  });
}