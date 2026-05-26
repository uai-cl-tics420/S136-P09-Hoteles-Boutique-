import { NextRequest, NextResponse } from "next/server";
import { getBookingById, cancelBooking, updateBookingStatus } from "@/services/booking.service";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const user = session.user as any;
    // Guests can only view their own bookings; admins can view any.
    const guestId = user.role === "GUEST" ? user.id : undefined;
    const booking = await getBookingById(id, guestId);
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (_err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const booking = await cancelBooking(id, (session.user as any).id);
    if (!booking) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (_err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const { status } = await request.json();
    const allowed = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }
    const booking = await updateBookingStatus(id, status);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (_err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}