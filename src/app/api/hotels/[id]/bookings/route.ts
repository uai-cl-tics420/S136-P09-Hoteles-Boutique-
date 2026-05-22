import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { bookings, roomTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/hotels/[id]/bookings/completed
 * Retorna si el usuario autenticado tiene una reserva completada en este hotel.
 * Útil para mostrar el formulario de reseña en la página del hotel.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ hasCompleted: false });
    }

    const { id: hotelId } = await params;

    // Buscar roomTypes de este hotel
    const hotelRooms = await db
      .select({ id: roomTypes.id })
      .from(roomTypes)
      .where(eq(roomTypes.hotelId, hotelId));

    if (hotelRooms.length === 0) {
      return NextResponse.json({ hasCompleted: false, bookingId: null });
    }

    const roomIds = hotelRooms.map((r) => r.id);

    // Buscar reserva COMPLETADA del usuario en alguno de esos room types
    const completed = await db.query.bookings.findFirst({
      where: (b, { and, eq, inArray }) =>
        and(
          eq(b.guestId, (session.user as any).id),
          eq(b.status, "COMPLETED"),
          inArray(b.roomTypeId, roomIds)
        ),
    });

    return NextResponse.json({
      hasCompleted: !!completed,
      bookingId: completed?.id ?? null,
    });
  } catch (error) {
    return NextResponse.json({ hasCompleted: false, bookingId: null });
  }
}
