import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, hotels, roomTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== "HOTEL_ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let results;

    if (role === "SUPER_ADMIN") {
      // SUPER_ADMIN can see all bookings across all hotels
      results = await db.query.bookings.findMany({
        with: { roomType: { with: { hotel: true } } },
        orderBy: (b, { desc }) => [desc(b.createdAt)],
      });
    } else {
      // HOTEL_ADMIN sees only bookings for their own hotels
      const ownedHotels = await db.query.hotels.findMany({
        where: eq(hotels.ownerId, (session.user as any).id),
      });
      const hotelIds = ownedHotels.map((h) => h.id);

      if (hotelIds.length === 0) return NextResponse.json({ bookings: [] });

      const allRoomTypes = await db.query.roomTypes.findMany({
        where: (rt, { inArray }) => inArray(rt.hotelId, hotelIds),
      });
      const roomTypeIds = allRoomTypes.map((rt) => rt.id);

      if (roomTypeIds.length === 0) return NextResponse.json({ bookings: [] });

      results = await db.query.bookings.findMany({
        where: (b, { inArray }) => inArray(b.roomTypeId, roomTypeIds),
        with: { roomType: { with: { hotel: true } } },
        orderBy: (b, { desc }) => [desc(b.createdAt)],
      });
    }

    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error("[admin/bookings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}