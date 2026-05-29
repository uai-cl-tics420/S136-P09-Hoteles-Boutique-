import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { roomTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];

/**
 * PATCH /api/admin/hotels/[id]/room-types/[rtId]
 * Edita un tipo de habitación.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rtId: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId, rtId } = await params;
    const body = await req.json();
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.capacity !== undefined) updateData.capacity = parseInt(body.capacity);
    if (body.pricePerNight !== undefined) updateData.pricePerNight = parseFloat(body.pricePerNight).toFixed(2);
    if (body.totalRooms !== undefined) updateData.totalRooms = parseInt(body.totalRooms);
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(roomTypes)
      .set(updateData)
      .where(and(eq(roomTypes.id, rtId), eq(roomTypes.hotelId, hotelId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    return NextResponse.json({ roomType: updated });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/hotels/[id]/room-types/[rtId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rtId: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId, rtId } = await params;
    await db.delete(roomTypes).where(and(eq(roomTypes.id, rtId), eq(roomTypes.hotelId, hotelId)));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
