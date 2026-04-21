import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { z } from "zod";
import { db } from "@/db";
import { reviews, hotels } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { createReview, getReviewsByHotel } from "@/services/review.service";

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  hotelId: z.string().uuid(),
  ratingOverall: z.number().int().min(1).max(5),
  ratingService: z.number().int().min(1).max(5),
  ratingCleanliness: z.number().int().min(1).max(5),
  ratingLocation: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const hotelId = searchParams.get("hotelId");
    const ranking = searchParams.get("ranking");

    // FIX: Endpoint de ranking — calcula promedios en una sola query SQL
    // (antes la página cargaba 50 hoteles + N queries de ratings)
    if (ranking === "true") {
      const rankingData = await db
        .select({
          id: hotels.id,
          name: hotels.name,
          slug: hotels.slug,
          category: hotels.category,
          starRating: hotels.starRating,
          locationCity: hotels.locationCity,
          avgOverall:     sql<number>`ROUND(AVG(${reviews.ratingOverall})::numeric, 2)`,
          avgService:     sql<number>`ROUND(AVG(${reviews.ratingService})::numeric, 2)`,
          avgCleanliness: sql<number>`ROUND(AVG(${reviews.ratingCleanliness})::numeric, 2)`,
          avgLocation:    sql<number>`ROUND(AVG(${reviews.ratingLocation})::numeric, 2)`,
          reviewCount:    sql<number>`COUNT(${reviews.id})`,
        })
        .from(reviews)
        .innerJoin(hotels, eq(reviews.hotelId, hotels.id))
        .groupBy(hotels.id, hotels.name, hotels.slug, hotels.category, hotels.starRating, hotels.locationCity)
        .having(sql`COUNT(${reviews.id}) > 0`)
        .orderBy(desc(sql`AVG(${reviews.ratingOverall})`));

      return NextResponse.json({ ranking: rankingData });
    }

    if (!hotelId) return NextResponse.json({ error: "hotelId required" }, { status: 400 });

    const hotelReviews = await getReviewsByHotel(hotelId);
    return NextResponse.json({ reviews: hotelReviews });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const data = reviewSchema.parse(body);

    const review = await createReview({ ...data, guestId: session.user.id });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
