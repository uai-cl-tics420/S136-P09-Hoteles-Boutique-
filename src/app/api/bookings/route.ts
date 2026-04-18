import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBookingsByGuest } from "@/services/booking.service";
import { auth } from "@/lib/auth/nextauth.config";

/**
 * GET /api/bookings
 * Devuelve todas las reservas del usuario autenticado.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await getBookingsByGuest((session.user as any).id);
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[GET /api/bookings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/bookings
 * Crea una nueva reserva para el usuario autenticado.
 *
 * Body esperado:
 * {
 *   roomTypeId: string;          // UUID del tipo de habitación
 *   checkIn: string;             // "YYYY-MM-DD"
 *   checkOut: string;            // "YYYY-MM-DD"
 *   guestsCount: number;
 *   specialRequests?: string;
 *   extras?: { extraServiceId: string; quantity: number }[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roomTypeId, checkIn, checkOut, guestsCount, specialRequests, extras } = body;

    // Validaciones básicas
    if (!roomTypeId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "roomTypeId, checkIn y checkOut son requeridos" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: "Formato de fecha inválido. Usa YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "La fecha de salida debe ser posterior a la de entrada" },
        { status: 400 }
      );
    }

    if (checkInDate < new Date(new Date().toDateString())) {
      return NextResponse.json(
        { error: "La fecha de entrada no puede ser en el pasado" },
        { status: 400 }
      );
    }

    const guestId = (session.user as any).id as string;

    const booking = await createBooking(guestId, {
      roomTypeId,
      checkIn,
      checkOut,
      guestsCount: guestsCount ?? 1,
      specialRequests: specialRequests ?? undefined,
      extras: extras ?? [],
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/bookings]", error);

    // Mensaje amigable si el tipo de habitación no existe
    if (error?.message === "Room type not found") {
      return NextResponse.json(
        { error: "El tipo de habitación no existe" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}