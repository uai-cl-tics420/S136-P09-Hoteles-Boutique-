import { NextRequest, NextResponse } from "next/server";
import { createReview, getReviewsByHotel } from "@/services/review.service";
import { auth } from "@/lib/auth/nextauth.config";
import { z } from "zod";

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
    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) return NextResponse.json({ error: "hotelId required" }, { status: 400 });
    const reviews = await getReviewsByHotel(hotelId);
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const data = reviewSchema.parse(body);
    const review = await createReview({ ...data, guestId: (session.user as any).id });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}