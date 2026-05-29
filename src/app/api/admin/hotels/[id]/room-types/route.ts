import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { roomTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];

/**
 * GET /api/admin/hotels/[id]/room-types
 * Lista los tipos de habitación de un hotel.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId } = await params;
    const rooms = await db.query.roomTypes.findMany({
      where: eq(roomTypes.hotelId, hotelId),
      orderBy: (rt, { asc }) => [asc(rt.name)],
    });
    return NextResponse.json({ roomTypes: rooms });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/hotels/[id]/room-types
 * Crea un nuevo tipo de habitación.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId } = await params;
    const body = await req.json();
    const { name, description, capacity, pricePerNight, totalRooms, amenities, currency } = body;

    if (!name || !pricePerNight || !capacity) {
      return NextResponse.json({ error: "name, pricePerNight y capacity son requeridos" }, { status: 400 });
    }

    const [room] = await db.insert(roomTypes).values({
      hotelId,
      name,
      description: description || null,
      capacity: parseInt(capacity),
      pricePerNight: parseFloat(pricePerNight).toFixed(2),
      totalRooms: parseInt(totalRooms ?? 1),
      amenities: amenities ?? [],
      currency: currency ?? "CLP",
    }).returning();

    return NextResponse.json({ roomType: room }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/hotels/[id]/room-types]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
