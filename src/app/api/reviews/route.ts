import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { z } from "zod";

// @ts-ignore (Callamos el error del import sí o sí)
import { createReview, getReviewsByHotel } from "../../../services/review.service";

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
    
    // @ts-ignore
    const reviews = await getReviewsByHotel(hotelId);
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await request.json();
    const data = reviewSchema.parse(body);
    
    // @ts-ignore
    const review = await createReview({ ...data, guestId: session.user.id });
    return NextResponse.json({ review }, { status: 201 });
    
  } catch (error) {
    // @ts-ignore (Forzamos a que asuma que existe .errors)
    if (error?.errors) return NextResponse.json({ error: error.errors }, { status: 400 });
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}