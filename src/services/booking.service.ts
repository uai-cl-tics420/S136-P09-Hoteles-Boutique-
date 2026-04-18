import { db } from "@/db";
import { bookings, bookingExtras, availability, roomTypes } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { CreateBookingRequest } from "@/types/api";

export async function createBooking(guestId: string, data: CreateBookingRequest) {
  const roomType = await db.query.roomTypes.findFirst({
    where: eq(roomTypes.id, data.roomTypeId),
  });
  if (!roomType) throw new Error("Room type not found");

  const nights =
    (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) /
    (1000 * 60 * 60 * 24);
  const totalPrice = (parseFloat(roomType.pricePerNight) * nights).toFixed(2);

  const [booking] = await db
    .insert(bookings)
    .values({
      guestId,
      roomTypeId: data.roomTypeId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestsCount: data.guestsCount,
      totalPrice,
      currency: roomType.currency,
      status: "CONFIRMED",
      specialRequests: data.specialRequests ?? null,
    })
    .returning();

  if (data.extras?.length) {
    await db.insert(bookingExtras).values(
      data.extras.map((e) => ({
        bookingId: booking.id,
        extraServiceId: e.extraServiceId,
        quantity: e.quantity,
        unitPrice: "0",
      }))
    );
  }

  return booking;
}

export async function getBookingsByGuest(guestId: string) {
  return db.query.bookings.findMany({
    where: eq(bookings.guestId, guestId),
    with: { roomType: { with: { hotel: true } } },
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  });
}

export async function getBookingById(id: string) {
  return db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: {
      roomType: { with: { hotel: { with: { images: true } } } },
      extras: { with: { extraService: true } },
    },
  });
}

export async function cancelBooking(id: string, guestId: string) {
  const [updated] = await db
    .update(bookings)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(bookings.id, id), eq(bookings.guestId, guestId)))
    .returning();
  return updated;
}