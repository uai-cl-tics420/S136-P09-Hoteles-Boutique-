import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, hotels, roomTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all hotels owned by this admin
    const ownedHotels = await db.query.hotels.findMany({
      where: eq(hotels.ownerId, (session.user as any).id),
    });
    const hotelIds = ownedHotels.map((h) => h.id);

    if (hotelIds.length === 0) return NextResponse.json({ bookings: [] });

    // Get room types for those hotels
    const allRoomTypes = await db.query.roomTypes.findMany({
      where: (rt, { inArray }) => inArray(rt.hotelId, hotelIds),
    });
    const roomTypeIds = allRoomTypes.map((rt) => rt.id);

    if (roomTypeIds.length === 0) return NextResponse.json({ bookings: [] });

    const results = await db.query.bookings.findMany({
      where: (b, { inArray }) => inArray(b.roomTypeId, roomTypeIds),
      with: { roomType: { with: { hotel: true } } },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error("[admin/bookings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}