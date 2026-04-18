import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hotel = await db.query.hotels.findFirst({
      where: eq(hotels.id, id),
      with: {
        images: true,
        roomTypes: true,
        extraServices: { where: (s, { eq }) => eq(s.available, true) },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json({ hotel });
  } catch (error) {
    console.error("[GET /api/hotels/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(hotels)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(hotels.id, id))
      .returning();

    return NextResponse.json({ hotel: updated });
  } catch (error) {
    console.error("[PATCH /api/hotels/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}