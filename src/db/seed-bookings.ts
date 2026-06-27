/**
 * seed-bookings.ts
 * Genera ~1.200 reservas realistas distribuidas en los últimos 12 meses
 * con variedad de estados, fechas y precios.
 *
 * Uso: bun src/db/seed-bookings.ts
 */

import { db } from "./index";
import { bookings, roomTypes, users } from "./schema";
import { sql } from "drizzle-orm";

/* ── Helpers ───────────────────────────────────────────────── */
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function randDateInPast(rand: () => number, maxDaysAgo = 365): Date {
  const daysAgo = Math.floor(rand() * maxDaysAgo);
  return addDays(new Date(), -daysAgo);
}

/* ── Main ──────────────────────────────────────────────────── */
async function main() {
  console.log("🔍 Cargando usuarios y tipos de habitación...");

  const [userRows, roomTypeRows] = await Promise.all([
    db.execute(sql.raw("SELECT id FROM users LIMIT 100")),
    db.execute(sql.raw(
      "SELECT id, price_per_night FROM room_types ORDER BY RANDOM() LIMIT 300"
    )),
  ]);

  if (userRows.length === 0) {
    console.error("❌ No hay usuarios. Ejecuta el seed principal primero.");
    process.exit(1);
  }

  const userIds    = (userRows as unknown as { id: string }[]).map(u => u.id);
  const rooms      = roomTypeRows as unknown as { id: string; price_per_night: string }[];

  if (rooms.length === 0) {
    console.error("❌ No hay room_types.");
    process.exit(1);
  }

  const TARGET    = 1200;
  const BATCH     = 50;

  const statuses: Array<"PENDING"|"CONFIRMED"|"CANCELLED"|"COMPLETED"> =
    ["CONFIRMED","CONFIRMED","CONFIRMED","COMPLETED","COMPLETED","PENDING","PENDING","CANCELLED"];

  const specialRequests = [
    null, null, null,
    "Cama king size, por favor.",
    "Llegamos tarde, sobre las 23:00.",
    "Celebramos aniversario, sorpresa romántica.",
    "Necesitamos cuna para bebé.",
    "Alergia al mariscos, sin amenities con fragancia.",
    "Vista al mar preferentemente.",
    "Desayuno incluido si es posible.",
    "Check-in anticipado solicitado.",
    null,
  ];

  const rand = rng(42);
  let inserted = 0;
  const toInsert: typeof bookings.$inferInsert[] = [];

  for (let i = 0; i < TARGET; i++) {
    const room       = pick(rooms, rand);
    const guestId    = pick(userIds, rand);
    const status     = pick(statuses, rand);
    const nights     = 1 + Math.floor(rand() * 6); // 1-7 noches
    const guestsCount = 1 + Math.floor(rand() * 3);

    // Para reservas completadas/confirmadas, fechas en el pasado
    // Para pendientes, mezcla de pasado y futuro
    let checkIn: Date;
    if (status === "COMPLETED") {
      checkIn = randDateInPast(rand, 365);
    } else if (status === "CONFIRMED") {
      // 70% futuro, 30% pasado
      checkIn = rand() > 0.3
        ? addDays(new Date(), Math.floor(rand() * 90) + 1)
        : randDateInPast(rand, 60);
    } else if (status === "CANCELLED") {
      checkIn = randDateInPast(rand, 180);
    } else {
      // PENDING: futuro
      checkIn = addDays(new Date(), Math.floor(rand() * 60) + 1);
    }

    const checkOut = addDays(checkIn, nights);

    // Precio base con variación leve (±15%)
    const basePrice    = parseFloat(room.price_per_night);
    const variation    = 0.85 + rand() * 0.30; // 0.85 a 1.15
    const totalPrice   = Math.round(basePrice * nights * guestsCount * variation);

    // createdAt: siempre antes del checkIn
    const createdDaysBeforeCheckIn = 1 + Math.floor(rand() * 60);
    const createdAt = addDays(checkIn, -createdDaysBeforeCheckIn);

    toInsert.push({
      guestId,
      roomTypeId:      room.id,
      checkIn:         fmtDate(checkIn),
      checkOut:        fmtDate(checkOut),
      guestsCount,
      totalPrice:      String(totalPrice),
      currency:        "CLP",
      status,
      specialRequests: pick(specialRequests, rand) as string | null,
      createdAt,
      updatedAt:       createdAt,
    });
  }

  // Eliminar reservas seeded anteriores (las que no tienen request específico del sistema)
  console.log("🗑️  Eliminando reservas seed anteriores...");
  await db.execute(sql.raw(`
    DELETE FROM bookings
    WHERE guest_id IN (SELECT id FROM users)
      AND special_requests NOT LIKE '%SISTEMA%'
    RETURNING id
  `)).catch(() => {
    // Si falla (e.g., constraint), ignorar y solo insertar
    console.log("   (No se eliminaron reservas previas)");
  });

  // Insertar en batches
  console.log(`✍️  Insertando ${TARGET} reservas en batches de ${BATCH}...`);
  for (let b = 0; b < toInsert.length; b += BATCH) {
    const batch = toInsert.slice(b, b + BATCH);
    await db.insert(bookings).values(batch);
    inserted += batch.length;
    process.stdout.write(`   ${inserted}/${TARGET}\r`);
  }

  console.log(`\n✅ ${inserted} reservas insertadas exitosamente.`);

  // Estadísticas finales
  const stats = await db.execute(sql.raw(`
    SELECT status, COUNT(*) as cnt, SUM(CAST(total_price AS NUMERIC)) as total
    FROM bookings GROUP BY status ORDER BY cnt DESC
  `));
  console.log("\n📊 Estado final de reservas:");
  for (const s of stats as any[]) {
    console.log(`   ${s.status.padEnd(12)} ${s.cnt.toString().padStart(5)} reservas   $${Math.round(Number(s.total)/1000)}K CLP`);
  }

  process.exit(0);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
