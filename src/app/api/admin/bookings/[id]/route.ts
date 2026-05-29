import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { bookings, hotels, roomTypes } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];
const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

/**
 * PATCH /api/admin/bookings/[id]
 * Cambia el status de una reserva (solo el admin dueño del hotel).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status inválido. Valores válidos: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verificar que la reserva pertenece a un hotel del admin
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: { roomType: { with: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const adminId = (session.user as any).id as string;
    const hotelOwnerId = (booking.roomType as any)?.hotel?.ownerId;

    // SUPER_ADMIN puede cambiar cualquier reserva; HOTEL_ADMIN solo las suyas
    if (role === "HOTEL_ADMIN" && hotelOwnerId !== adminId) {
      return NextResponse.json({ error: "No tienes permisos sobre esta reserva" }, { status: 403 });
    }

    const [updated] = await db
      .update(bookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/bookings/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
