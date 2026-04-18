import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hotels, hotelImages, reviews } from "@/db/schema";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");
    const offset = (page - 1) * limit;

    const conditions = [eq(hotels.active, true)];

    if (city) {
      conditions.push(ilike(hotels.locationCity, `%${city}%`));
    }
    if (category) {
      conditions.push(eq(hotels.category, category as any));
    }

    const results = await db.query.hotels.findMany({
      where: and(...conditions),
      with: {
        images: {
          where: eq(hotelImages.isCover, true),
          limit: 1,
        },
      },
      limit,
      offset,
      orderBy: (hotels, { desc }) => [desc(hotels.createdAt)],
    });

    return NextResponse.json({ hotels: results, page, limit });
  } catch (error) {
    console.error("[GET /api/hotels]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const slug = body.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const [hotel] = await db
      .insert(hotels)
      .values({
        ...body,
        slug: `${slug}-${Date.now()}`,
        ownerId: session.user.id,
      })
      .returning();

    return NextResponse.json({ hotel }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/hotels]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}