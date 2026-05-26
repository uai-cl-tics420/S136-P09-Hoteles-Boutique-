import { db } from "@/db";
import { bookings, bookingExtras, extraServices, roomTypes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { CreateBookingRequest } from "@/types/api";

export async function createBooking(guestId: string, data: CreateBookingRequest) {
  const roomType = await db.query.roomTypes.findFirst({
    where: eq(roomTypes.id, data.roomTypeId),
  });
  if (!roomType) throw new Error("Room type not found");

  const nights =
    (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) /
    (1000 * 60 * 60 * 24);
  const roomTotal = parseFloat(roomType.pricePerNight) * nights;

  // Fetch actual unit prices for requested extras in a single query
  let extrasTotal = 0;
  let extraPriceMap: Record<string, string> = {};
  if (data.extras?.length) {
    const extraIds = data.extras.map((e) => e.extraServiceId);
    const fetchedExtras = await db
      .select({ id: extraServices.id, price: extraServices.price })
      .from(extraServices)
      .where(inArray(extraServices.id, extraIds));

    extraPriceMap = Object.fromEntries(fetchedExtras.map((e) => [e.id, e.price]));
    extrasTotal = data.extras.reduce((acc, e) => {
      const unitPrice = parseFloat(extraPriceMap[e.extraServiceId] ?? "0");
      return acc + unitPrice * e.quantity;
    }, 0);
  }

  const totalPrice = (roomTotal + extrasTotal).toFixed(2);

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
        unitPrice: extraPriceMap[e.extraServiceId] ?? "0",
      }))
    );
  }

  return booking;
}

export async function getBookingsByGuest(guestId: string) {
  return db.query.bookings.findMany({
    where: eq(bookings.guestId, guestId),
    with: {
      roomType: { with: { hotel: { with: { images: true } } } },
      extras: { with: { extraService: true } },
    },
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  });
}

export async function getBookingById(id: string, guestId?: string) {
  return db.query.bookings.findFirst({
    where: guestId
      ? and(eq(bookings.id, id), eq(bookings.guestId, guestId))
      : eq(bookings.id, id),
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

export async function updateBookingStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
) {
  const [updated] = await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();
  return updated;
}