import { NextRequest, NextResponse } from "next/server";
import { getHotels } from "@/services/hotel.service";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { auth } from "@/lib/auth/nextauth.config";
import type { HotelCategory } from "@/types/domain";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const minStarsRaw = searchParams.get("minStars");
    const maxPriceRaw = searchParams.get("maxPrice");

    const results = await getHotels({
      city: searchParams.get("city") ?? undefined,
      category: (searchParams.get("category") as HotelCategory) ?? undefined,
      minStars: minStarsRaw ? parseInt(minStarsRaw) : undefined,
      maxPrice: maxPriceRaw ? parseFloat(maxPriceRaw) : undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "12"),
    });

    return NextResponse.json({ hotels: results });
  } catch (error) {
    console.error("[GET /api/hotels]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const slug = `${body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
    const [hotel] = await db
      .insert(hotels)
      .values({ ...body, slug, ownerId: (session.user as any).id })
      .returning();
    return NextResponse.json({ hotel }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/hotels]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}