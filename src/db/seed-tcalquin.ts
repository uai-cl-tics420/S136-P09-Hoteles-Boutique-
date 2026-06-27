/**
 * seed-tcalquin.ts
 * Crea o actualiza el usuario tcalquin3@gmail.com como HOTEL_ADMIN,
 * le asigna 2 propiedades boutique con imágenes y tipos de habitación,
 * y genera ~20 reservas variadas para mostrar en el dashboard.
 *
 * Uso: bun src/db/seed-tcalquin.ts
 */

import { db } from "./index";
import { users, hotels, hotelImages, roomTypes, bookings } from "./schema";
import { eq, sql } from "drizzle-orm";

// ── Helpers ────────────────────────────────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const TARGET_EMAIL = "tcalquin3@gmail.com";
  console.log(`\n🏨  Seed para ${TARGET_EMAIL}\n`);

  // 1. Upsert usuario ──────────────────────────────────────────────────────────
  const existing = await db.query.users.findFirst({
    where: eq(users.email, TARGET_EMAIL),
  });

  let userId: string;

  if (existing) {
    userId = existing.id;
    // Asegurar rol HOTEL_ADMIN
    if (existing.role !== "HOTEL_ADMIN" && existing.role !== "SUPER_ADMIN") {
      await db
        .update(users)
        .set({ role: "HOTEL_ADMIN", updatedAt: new Date() })
        .where(eq(users.id, userId));
      console.log(`✅ Usuario encontrado → rol actualizado a HOTEL_ADMIN`);
    } else {
      console.log(`✅ Usuario encontrado (rol: ${existing.role})`);
    }
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        email: TARGET_EMAIL,
        ssoProvider: "google",
        role: "HOTEL_ADMIN",
        locale: "es",
      })
      .returning({ id: users.id });
    userId = newUser.id;
    console.log(`✅ Usuario creado con id: ${userId}`);
  }

  // 2. Eliminar propiedades anteriores de este seed (para re-ejecutar limpio) ──
  // Sólo borra hoteles que tengan el slug de este seed
  const SLUGS = ["hotel-lastarria-boutique", "casa-de-campo-vina"];
  for (const slug of SLUGS) {
    await db.delete(hotels).where(eq(hotels.slug, slug)).catch(() => {});
  }

  // 3. Crear las dos propiedades ───────────────────────────────────────────────
  console.log("\n🏗️  Creando propiedades...");

  const [hotel1] = await db
    .insert(hotels)
    .values({
      ownerId: userId,
      name: "Hotel Lastarria Boutique",
      slug: "hotel-lastarria-boutique",
      description:
        "Un refugio urbano en el corazón del barrio Lastarria de Santiago. Decoración de autor, patio patrimonial y servicio personalizado que define el lujo auténtico. A pasos de los mejores restaurantes y galerías de arte de la ciudad.",
      locationCity: "Santiago",
      locationCountry: "Chile",
      address: "José Victorino Lastarria 299, Santiago",
      latitude: -33.4373,
      longitude: -70.6432,
      category: "BOUTIQUE",
      starRating: 5,
      googleRating: 4.8,
      googleRatingCount: 312,
      active: true,
    })
    .returning({ id: hotels.id });

  const [hotel2] = await db
    .insert(hotels)
    .values({
      ownerId: userId,
      name: "Casa de Campo Viña",
      slug: "casa-de-campo-vina",
      description:
        "Hacienda boutique en los viñedos del Valle de Casablanca. Experiencia vitivinícola única con catas privadas, spa de vinoterapia y habitaciones con vista panorámica al viñedo. Un lujo tranquilo a sólo 90 minutos de Santiago.",
      locationCity: "Casablanca",
      locationCountry: "Chile",
      address: "Ruta 68 Km 62, Valle de Casablanca, Valparaíso",
      latitude: -33.3167,
      longitude: -71.4167,
      category: "LUXURY",
      starRating: 5,
      googleRating: 4.9,
      googleRatingCount: 178,
      active: true,
    })
    .returning({ id: hotels.id });

  console.log(`   ✓ ${hotel1.id} → Hotel Lastarria Boutique`);
  console.log(`   ✓ ${hotel2.id} → Casa de Campo Viña`);

  // 4. Imágenes de portada ─────────────────────────────────────────────────────
  console.log("\n🖼️  Agregando imágenes...");

  await db.insert(hotelImages).values([
    // Hotel Lastarria
    {
      hotelId: hotel1.id,
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85&auto=format&fit=crop",
      altText: "Hotel Lastarria Boutique — fachada patrimonial",
      sortOrder: 0,
      isCover: true,
    },
    {
      hotelId: hotel1.id,
      url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85&auto=format&fit=crop",
      altText: "Hotel Lastarria — habitación deluxe",
      sortOrder: 1,
      isCover: false,
    },
    {
      hotelId: hotel1.id,
      url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=85&auto=format&fit=crop",
      altText: "Hotel Lastarria — lobby y patio interior",
      sortOrder: 2,
      isCover: false,
    },
    // Casa de Campo Viña
    {
      hotelId: hotel2.id,
      url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85&auto=format&fit=crop",
      altText: "Casa de Campo Viña — vista al viñedo",
      sortOrder: 0,
      isCover: true,
    },
    {
      hotelId: hotel2.id,
      url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=85&auto=format&fit=crop",
      altText: "Casa de Campo Viña — suite principal",
      sortOrder: 1,
      isCover: false,
    },
    {
      hotelId: hotel2.id,
      url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=85&auto=format&fit=crop",
      altText: "Casa de Campo Viña — spa de vinoterapia",
      sortOrder: 2,
      isCover: false,
    },
  ]);
  console.log("   ✓ 6 imágenes insertadas");

  // 5. Tipos de habitación ─────────────────────────────────────────────────────
  console.log("\n🛏️  Creando tipos de habitación...");

  const [rt1a] = await db
    .insert(roomTypes)
    .values({
      hotelId: hotel1.id,
      name: "Habitación Clásica",
      description: "Elegancia atemporal con vista al patio patrimonial. Cama queen, baño de mármol y amenities de autor.",
      capacity: 2,
      pricePerNight: "185000",
      currency: "CLP",
      totalRooms: 6,
      amenities: ["WiFi de alta velocidad", "Minibar", "Caja de seguridad", "Smart TV", "Baño de mármol"],
    })
    .returning({ id: roomTypes.id });

  const [rt1b] = await db
    .insert(roomTypes)
    .values({
      hotelId: hotel1.id,
      name: "Suite Lastarria",
      description: "Nuestra suite insignia. Sala de estar independiente, terraza privada con vista a los Andes y servicio de mayordomo.",
      capacity: 2,
      pricePerNight: "320000",
      currency: "CLP",
      totalRooms: 3,
      amenities: ["Terraza privada", "Bañera independiente", "Mayordomo", "Desayuno incluido", "Traslado aeropuerto"],
    })
    .returning({ id: roomTypes.id });

  const [rt2a] = await db
    .insert(roomTypes)
    .values({
      hotelId: hotel2.id,
      name: "Habitación Viñedo",
      description: "Dormitorio con ventanales panorámicos hacia los viñedos. Decoración rústica de lujo y cama king size.",
      capacity: 2,
      pricePerNight: "240000",
      currency: "CLP",
      totalRooms: 8,
      amenities: ["Vista al viñedo", "Cama king", "Cata de vinos diaria", "Desayuno gourmet", "Acceso al spa"],
    })
    .returning({ id: roomTypes.id });

  const [rt2b] = await db
    .insert(roomTypes)
    .values({
      hotelId: hotel2.id,
      name: "Suite Hacienda",
      description: "La experiencia definitiva de la hacienda. Suite de dos pisos con jacuzzi exterior privado y sommelier personal.",
      capacity: 3,
      pricePerNight: "480000",
      currency: "CLP",
      totalRooms: 2,
      amenities: ["Jacuzzi exterior", "Sommelier personal", "Cena privada en el viñedo", "Helipuerto", "Chef privado"],
    })
    .returning({ id: roomTypes.id });

  console.log(`   ✓ 4 tipos de habitación creados`);

  // 6. Obtener algunos usuarios existentes como huéspedes ──────────────────────
  const guestRows = await db.execute(
    sql`SELECT id FROM users WHERE role = 'GUEST' ORDER BY RANDOM() LIMIT 20`
  );
  const guestIds = (guestRows as unknown as { id: string }[]).map((r) => r.id);

  // Si no hay suficientes guests, usamos el mismo usuario como fallback
  if (guestIds.length < 5) {
    guestIds.push(userId);
  }

  // 7. Crear reservas ──────────────────────────────────────────────────────────
  console.log("\n📋  Generando reservas...");

  const now = new Date();
  const toInsert: typeof bookings.$inferInsert[] = [];

  // Reservas completadas (pasado)
  const completedBookings = [
    { rt: rt1a.id, daysAgo: 120, nights: 2, guests: 2, status: "COMPLETED" as const, note: "Excelente estadía, volveremos." },
    { rt: rt1b.id, daysAgo: 90,  nights: 3, guests: 2, status: "COMPLETED" as const, note: "Celebramos aniversario, perfecta atención." },
    { rt: rt2a.id, daysAgo: 75,  nights: 4, guests: 2, status: "COMPLETED" as const, note: "Vista increíble al viñedo." },
    { rt: rt2b.id, daysAgo: 60,  nights: 2, guests: 3, status: "COMPLETED" as const, note: "Suite Hacienda superó expectativas." },
    { rt: rt1a.id, daysAgo: 45,  nights: 1, guests: 1, status: "COMPLETED" as const, note: null },
    { rt: rt2a.id, daysAgo: 30,  nights: 3, guests: 2, status: "COMPLETED" as const, note: "Cata de vinos incluida, espectacular." },
  ];

  // Reservas confirmadas (pasado reciente o futuro próximo)
  const confirmedBookings = [
    { rt: rt1b.id, daysFromNow: -5,  nights: 3, guests: 2, status: "CONFIRMED" as const, note: "Habitación con vista preferida." },
    { rt: rt2a.id, daysFromNow: 10,  nights: 2, guests: 2, status: "CONFIRMED" as const, note: null },
    { rt: rt1a.id, daysFromNow: 15,  nights: 2, guests: 2, status: "CONFIRMED" as const, note: "Cama king si es posible." },
    { rt: rt2b.id, daysFromNow: 20,  nights: 4, guests: 2, status: "CONFIRMED" as const, note: "Cena privada en el viñedo." },
    { rt: rt1a.id, daysFromNow: 35,  nights: 1, guests: 1, status: "CONFIRMED" as const, note: null },
    { rt: rt2a.id, daysFromNow: 50,  nights: 5, guests: 3, status: "CONFIRMED" as const, note: "Luna de miel, sorpresa especial." },
  ];

  // Reservas pendientes (futuro)
  const pendingBookings = [
    { rt: rt1b.id, daysFromNow: 45,  nights: 2, guests: 2, status: "PENDING" as const, note: "Confirmación pendiente de pago." },
    { rt: rt2b.id, daysFromNow: 60,  nights: 3, guests: 2, status: "PENDING" as const, note: null },
    { rt: rt1a.id, daysFromNow: 90,  nights: 2, guests: 2, status: "PENDING" as const, note: "Check-in tardío ~22:00." },
  ];

  // Reservas canceladas
  const cancelledBookings = [
    { rt: rt2a.id, daysAgo: 50,  nights: 2, guests: 2, status: "CANCELLED" as const, note: "Canceló por viaje de negocios." },
    { rt: rt1a.id, daysAgo: 20,  nights: 3, guests: 2, status: "CANCELLED" as const, note: null },
  ];

  let guestIdx = 0;
  const nextGuest = () => guestIds[guestIdx++ % guestIds.length];

  // Completadas
  for (const b of completedBookings) {
    const checkIn  = addDays(now, -b.daysAgo);
    const checkOut = addDays(checkIn, b.nights);
    const price    = b.rt === rt1a.id ? 185000 : b.rt === rt1b.id ? 320000 : b.rt === rt2a.id ? 240000 : 480000;
    toInsert.push({
      guestId: nextGuest(),
      roomTypeId: b.rt,
      checkIn: fmtDate(checkIn),
      checkOut: fmtDate(checkOut),
      guestsCount: b.guests,
      totalPrice: String(price * b.nights),
      currency: "CLP",
      status: b.status,
      specialRequests: b.note,
      createdAt: addDays(checkIn, -7),
      updatedAt: addDays(checkIn, -7),
    });
  }

  // Confirmadas
  for (const b of confirmedBookings) {
    const checkIn  = addDays(now, b.daysFromNow);
    const checkOut = addDays(checkIn, b.nights);
    const price    = b.rt === rt1a.id ? 185000 : b.rt === rt1b.id ? 320000 : b.rt === rt2a.id ? 240000 : 480000;
    toInsert.push({
      guestId: nextGuest(),
      roomTypeId: b.rt,
      checkIn: fmtDate(checkIn),
      checkOut: fmtDate(checkOut),
      guestsCount: b.guests,
      totalPrice: String(price * b.nights),
      currency: "CLP",
      status: b.status,
      specialRequests: b.note,
      createdAt: addDays(checkIn, -14),
      updatedAt: addDays(checkIn, -14),
    });
  }

  // Pendientes
  for (const b of pendingBookings) {
    const checkIn  = addDays(now, b.daysFromNow);
    const checkOut = addDays(checkIn, b.nights);
    const price    = b.rt === rt1a.id ? 185000 : b.rt === rt1b.id ? 320000 : b.rt === rt2a.id ? 240000 : 480000;
    toInsert.push({
      guestId: nextGuest(),
      roomTypeId: b.rt,
      checkIn: fmtDate(checkIn),
      checkOut: fmtDate(checkOut),
      guestsCount: b.guests,
      totalPrice: String(price * b.nights),
      currency: "CLP",
      status: b.status,
      specialRequests: b.note,
      createdAt: addDays(now, -3),
      updatedAt: addDays(now, -3),
    });
  }

  // Canceladas
  for (const b of cancelledBookings) {
    const checkIn  = addDays(now, -b.daysAgo);
    const checkOut = addDays(checkIn, b.nights);
    const price    = b.rt === rt1a.id ? 185000 : b.rt === rt1b.id ? 320000 : b.rt === rt2a.id ? 240000 : 480000;
    toInsert.push({
      guestId: nextGuest(),
      roomTypeId: b.rt,
      checkIn: fmtDate(checkIn),
      checkOut: fmtDate(checkOut),
      guestsCount: b.guests,
      totalPrice: String(price * b.nights),
      currency: "CLP",
      status: b.status,
      specialRequests: b.note,
      createdAt: addDays(checkIn, -10),
      updatedAt: addDays(checkIn, -5),
    });
  }

  await db.insert(bookings).values(toInsert);
  console.log(`   ✓ ${toInsert.length} reservas insertadas`);

  // 8. Resumen ─────────────────────────────────────────────────────────────────
  console.log("\n🎉  ¡Seed completado!\n");
  console.log("📊  Resumen:");
  console.log(`    Usuario  : ${TARGET_EMAIL} (HOTEL_ADMIN)`);
  console.log(`    Hotel 1  : Hotel Lastarria Boutique (Santiago, Chile) — 5★ BOUTIQUE`);
  console.log(`    Hotel 2  : Casa de Campo Viña (Casablanca, Chile) — 5★ LUXURY`);
  console.log(`    Reservas : ${toInsert.length} total`);
  console.log(`               ${completedBookings.length} COMPLETED`);
  console.log(`               ${confirmedBookings.length} CONFIRMED`);
  console.log(`               ${pendingBookings.length} PENDING`);
  console.log(`               ${cancelledBookings.length} CANCELLED`);
  console.log("\n✅  Ahora puedes iniciar sesión con tcalquin3@gmail.com y ver los datos en el dashboard.\n");

  process.exit(0);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
