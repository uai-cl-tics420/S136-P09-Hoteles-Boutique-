import { db } from "@/db";
import { hotels, hotelImages, roomTypes } from "@/db/schema";
import { eq, ilike, and, asc } from "drizzle-orm";
import type { HotelCategory } from "@/types/domain";

export interface HotelFilters {
  city?: string;
  category?: HotelCategory;
  page?: number;
  limit?: number;
}

export async function getHotels(filters: HotelFilters = {}) {
  const { city, category, page = 1, limit = 12 } = filters;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(hotels.active, true)];

  if (city) conditions.push(ilike(hotels.locationCity, `%${city}%`));
  if (category) conditions.push(eq(hotels.category, category));

  return db
    .select()
    .from(hotels)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(asc(hotels.name));
}

export async function getHotelBySlug(slug: string) {
  return db
    .select()
    .from(hotels)
    .where(eq(hotels.slug, slug))
    .limit(1)
    .then(result => result[0] || null);
}

export async function getHotelById(id: string) {
  return db
    .select()
    .from(hotels)
    .where(eq(hotels.id, id))
    .limit(1)
    .then(result => result[0] || null);
}

export async function getHotelsByOwner(ownerId: string) {
  return db
    .select()
    .from(hotels)
    .where(eq(hotels.ownerId, ownerId))
    .orderBy(asc(hotels.name));
}