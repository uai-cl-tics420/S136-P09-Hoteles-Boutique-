import { relations } from "drizzle-orm";
import { users } from "./users";
import { hotels } from "./hotels";
import { hotelImages } from "./hotel-images";
import { roomTypes } from "./room-types";
import { extraServices } from "./extra-services";
import { bookings } from "./bookings";
import { bookingExtras } from "./booking-extras";
import { reviews } from "./reviews";

// ── users ────────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  hotels:   many(hotels),
  bookings: many(bookings),
  reviews:  many(reviews),
}));

// ── hotels ───────────────────────────────────────────────────────────────────
export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  owner:         one(users,         { fields: [hotels.ownerId],   references: [users.id] }),
  images:        many(hotelImages),
  roomTypes:     many(roomTypes),
  extraServices: many(extraServices),
  reviews:       many(reviews),
}));

// ── hotelImages ──────────────────────────────────────────────────────────────
export const hotelImagesRelations = relations(hotelImages, ({ one }) => ({
  hotel: one(hotels, { fields: [hotelImages.hotelId], references: [hotels.id] }),
}));

// ── roomTypes ────────────────────────────────────────────────────────────────
export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  hotel:        one(hotels,   { fields: [roomTypes.hotelId], references: [hotels.id] }),
  bookings:     many(bookings),
}));

// ── extraServices ────────────────────────────────────────────────────────────
export const extraServicesRelations = relations(extraServices, ({ one, many }) => ({
  hotel:          one(hotels, { fields: [extraServices.hotelId], references: [hotels.id] }),
  bookingExtras:  many(bookingExtras),
}));

// ── bookings ─────────────────────────────────────────────────────────────────
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  guest:    one(users,     { fields: [bookings.guestId],    references: [users.id] }),
  roomType: one(roomTypes, { fields: [bookings.roomTypeId], references: [roomTypes.id] }),
  extras:   many(bookingExtras),
  review:   many(reviews),
}));

// ── bookingExtras ────────────────────────────────────────────────────────────
export const bookingExtrasRelations = relations(bookingExtras, ({ one }) => ({
  booking:      one(bookings,      { fields: [bookingExtras.bookingId],      references: [bookings.id] }),
  extraService: one(extraServices, { fields: [bookingExtras.extraServiceId], references: [extraServices.id] }),
}));

// ── reviews ──────────────────────────────────────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one }) => ({
  hotel:   one(hotels,   { fields: [reviews.hotelId],  references: [hotels.id] }),
  guest:   one(users,    { fields: [reviews.guestId],  references: [users.id] }),
  booking: one(bookings, { fields: [reviews.bookingId],references: [bookings.id] }),
}));