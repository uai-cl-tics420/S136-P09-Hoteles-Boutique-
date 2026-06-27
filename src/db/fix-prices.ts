/**
 * fix-prices.ts
 * Actualiza los precios de room_types para que sean realistas y variados
 * según la categoría del hotel y el tipo de habitación.
 *
 * Uso: bun src/db/fix-prices.ts
 */

import { db } from "./index";
import { sql } from "drizzle-orm";

/* ── Rangos de precio por categoría del hotel (CLP / noche) ── */
const CATEGORY_RANGES: Record<string, [number, number]> = {
  LUXURY:   [280_000, 950_000],
  BOUTIQUE: [120_000, 380_000],
  ECO:      [55_000,  160_000],
  BEACH:    [150_000, 480_000],
  MOUNTAIN: [90_000,  300_000],
  CITY:     [75_000,  220_000],
};

/* Multiplicadores por tipo de habitación */
const ROOM_MULTIPLIERS: Record<string, number> = {
  "habitación estándar":    1.0,
  "habitación clásica":     1.0,
  "habitación superior":    1.25,
  "habitación doble":       1.15,
  "room boutique":          1.2,
  "junior suite":           1.5,
  "suite deluxe":           1.8,
  "suite premium":          2.0,
  "suite master":           2.3,
  "cabaña estándar":        1.1,
  "cabaña familiar":        1.6,
  "villa privada":          2.5,
  "penthouse":              3.0,
};

function seededRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

async function main() {
  console.log("🔍 Cargando tipos de habitación...");

  const rooms = await db.execute(sql.raw(`
    SELECT rt.id, rt.name, rt.price_per_night, h.category
    FROM room_types rt
    JOIN hotels h ON h.id = rt.hotel_id
    ORDER BY h.category, rt.name
  `)) as { id: string; name: string; price_per_night: string; category: string }[];

  console.log(`   ${rooms.length} habitaciones encontradas`);

  const rand = seededRand(7777);
  let updated = 0;

  const BATCH = 50;
  const updateCases: string[] = [];

  for (const room of rooms) {
    const range = CATEGORY_RANGES[room.category] ?? [80_000, 250_000];
    const [min, max] = range;

    // Buscar multiplicador según el nombre del tipo de habitación
    const nameLower = room.name.toLowerCase();
    let multiplier = 1.0;
    for (const [key, mult] of Object.entries(ROOM_MULTIPLIERS)) {
      if (nameLower.includes(key) || key.includes(nameLower.split(" ")[0])) {
        multiplier = mult;
        break;
      }
    }

    // Precio base para la categoría del hotel
    const base = min + rand() * (max - min);
    // Aplicar multiplicador del tipo de habitación
    const price = clamp(Math.round(base * multiplier / 1000) * 1000, min, max * 2.5);

    updateCases.push(`WHEN '${room.id}' THEN ${price}`);
  }

  // Actualizar en batches
  for (let i = 0; i < updateCases.length; i += BATCH) {
    const batch = updateCases.slice(i, i + BATCH);
    const ids = rooms.slice(i, i + BATCH).map(r => `'${r.id}'`).join(",");
    await db.execute(sql.raw(`
      UPDATE room_types
      SET price_per_night = CASE id
        ${batch.join("\n        ")}
        ELSE price_per_night
      END
      WHERE id IN (${ids})
    `));
    updated += batch.length;
    process.stdout.write(`   ${updated}/${rooms.length}\r`);
  }

  console.log(`\n✅ ${updated} precios actualizados`);

  // Muestra resumen
  const summary = await db.execute(sql.raw(`
    SELECT h.category,
      MIN(CAST(rt.price_per_night AS NUMERIC)) as min_price,
      MAX(CAST(rt.price_per_night AS NUMERIC)) as max_price,
      ROUND(AVG(CAST(rt.price_per_night AS NUMERIC))) as avg_price,
      COUNT(*) as rooms
    FROM room_types rt
    JOIN hotels h ON h.id = rt.hotel_id
    GROUP BY h.category
    ORDER BY avg_price DESC
  `)) as any[];

  console.log("\n📊 Precios por categoría (CLP/noche):");
  for (const s of summary) {
    console.log(
      `   ${s.category.padEnd(10)} min: $${Math.round(s.min_price/1000)}K  ` +
      `max: $${Math.round(s.max_price/1000)}K  avg: $${Math.round(s.avg_price/1000)}K  ` +
      `(${s.rooms} habitaciones)`
    );
  }

  process.exit(0);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
