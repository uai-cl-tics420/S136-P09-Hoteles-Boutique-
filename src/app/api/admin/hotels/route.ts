import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hotels, hotelImages, reviews } from "@/db/schema";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== "HOTEL_ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");
    const offset = (page - 1) * limit;

    const conditions = [];
    
    if (role === "HOTEL_ADMIN") {
      conditions.push(eq(hotels.ownerId, session.user.id));
    }

    if (city) {
      conditions.push(ilike(hotels.locationCity, `%${city}%`));
    }
    if (category) {
      conditions.push(eq(hotels.category, category as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.query.hotels.findMany({
      where: whereClause,
      with: {
        images: {
          where: eq(hotelImages.isCover, true),
        },
      },
      limit,
      offset,
      orderBy: (hotels, { desc }) => [desc(hotels.createdAt)],
    });

    return NextResponse.json({ hotels: results, page, limit });
  } catch (error) {
    console.error("[GET /api/admin/hotels]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== "HOTEL_ADMIN" && role !== "SUPER_ADMIN")) {
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