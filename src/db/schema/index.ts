// src/db/schema/index.ts
// Re-exporta todos los schemas para que Drizzle los encuentre desde un solo punto

export * from "./users";
export * from "./hotels";
export * from "./room-types";
export * from "./availability";
export * from "./bookings";
export * from "./booking-extras";
export * from "./extra-services";
export * from "./reviews";
export * from "./hotel-images";
export * from "./guest-preferences";