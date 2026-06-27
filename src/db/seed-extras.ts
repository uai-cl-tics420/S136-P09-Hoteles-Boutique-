/**
 * seed-extras.ts
 * Inserts extra services for all existing hotels that don't have any yet.
 * Run with: bun run src/db/seed-extras.ts
 */
import { db } from "./index";
import { hotels, extraServices } from "./schema";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env" });

const EXTRAS_BY_CAT: Record<string, { name: string; category: string; price: string }[]> = {
  LUXURY: [
    { name: "Spa & Masajes",         category: "SPA",        price: "85000" },
    { name: "Cena Gourmet Privada",  category: "DINING",     price: "120000" },
    { name: "Transfer Aeropuerto",   category: "TRANSPORT",  price: "45000" },
    { name: "Tour Privado Exclusivo",category: "EXPERIENCE", price: "95000" },
  ],
  BOUTIQUE: [
    { name: "Desayuno en la Habitación", category: "DINING",     price: "25000" },
    { name: "Masaje Relajante",          category: "SPA",        price: "60000" },
    { name: "City Tour Privado",         category: "EXPERIENCE", price: "55000" },
  ],
  ECO: [
    { name: "Trekking Guiado",       category: "EXPERIENCE", price: "40000" },
    { name: "Yoga al Amanecer",      category: "SPA",        price: "30000" },
    { name: "Traslado Ecoturístico", category: "TRANSPORT",  price: "35000" },
  ],
  BEACH: [
    { name: "Kayak & Snorkel",       category: "EXPERIENCE", price: "50000" },
    { name: "Cena en la Playa",      category: "DINING",     price: "90000" },
    { name: "Masaje Sunset",         category: "SPA",        price: "70000" },
  ],
  MOUNTAIN: [
    { name: "Senderismo Guiado",     category: "EXPERIENCE", price: "45000" },
    { name: "Fogón Gourmet",         category: "DINING",     price: "55000" },
    { name: "Transfer Montaña",      category: "TRANSPORT",  price: "40000" },
  ],
  CITY: [
    { name: "Transfer VIP",          category: "TRANSPORT",  price: "38000" },
    { name: "Cena de Negocios",      category: "DINING",     price: "75000" },
    { name: "City Tour Premium",     category: "EXPERIENCE", price: "50000" },
  ],
};

async function seed() {
  console.log("🌱 Seeding extra services for existing hotels...");

  // Get all hotels
  const allHotels = await db.select({ id: hotels.id, category: hotels.category, name: hotels.name }).from(hotels);
  console.log(`Found ${allHotels.length} hotels.`);

  // Get hotels that already have extras
  const existingExtras = await db
    .select({ hotelId: extraServices.hotelId })
    .from(extraServices);
  const hotelsWithExtras = new Set(existingExtras.map(e => e.hotelId));

  let inserted = 0;
  for (const hotel of allHotels) {
    if (hotelsWithExtras.has(hotel.id)) {
      console.log(`⏭  Skipping ${hotel.name} (already has extras)`);
      continue;
    }
    const extrasForCat = EXTRAS_BY_CAT[hotel.category] ?? EXTRAS_BY_CAT.BOUTIQUE;
    for (const extra of extrasForCat) {
      await db.insert(extraServices).values({
        hotelId: hotel.id,
        name: extra.name,
        description: null,
        price: extra.price,
        currency: "CLP",
        category: extra.category as any,
        available: true,
      });
    }
    console.log(`✅ Added ${extrasForCat.length} extras to: ${hotel.name}`);
    inserted++;
  }

  console.log(`\n✅ Done! Added extras to ${inserted} hotels.`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
