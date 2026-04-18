import { db } from "./index";
import { hotels } from "./schema/hotels";
import { roomTypes } from "./schema";
import { users } from "./schema/users";

async function seedHotels() {
  try {
    console.log("🌍 Iniciando seed de hoteles boutique con imágenes...\n");

    // Obtener usuario propietario
    let owner = await db.query.users.findFirst();
    const ownerId = owner?.id;
    console.log(`✓ Propietario: ${owner?.email}\n`);

    // Traer todos los hoteles existentes
    const allHotels = await db.query.hotels.findMany();
    console.log(`✓ Hoteles existentes: ${allHotels.length}\n`);

    // Insertar tipos de habitación
    console.log("🛏️ Insertando tipos de habitación...\n");
    const roomTypeTemplates = [
      { name: "Suite Deluxe", description: "Suite con vistas panorámicas", capacity: 2, pricePerNight: 100 },
      { name: "Habitación Estándar", description: "Habitación acogedora y cómoda", capacity: 2, pricePerNight: 60 },
      { name: "Suite Presidencial", description: "Suite de lujo máximo", capacity: 4, pricePerNight: 250 },
      { name: "Cabaña Privada", description: "Cabaña rodeada de naturaleza", capacity: 2, pricePerNight: 80 },
      { name: "Penthouse", description: "Penthouse exclusivo en azotea", capacity: 2, pricePerNight: 200 },
    ];

    let insertedCount = 0;
    let existingCount = 0;

    for (const hotel of allHotels) {
      const typesToInsert = roomTypeTemplates.slice(0, 3 + Math.floor(Math.random() * 2));
      for (const roomType of typesToInsert) {
        const existing = await db.query.roomTypes.findFirst({
          where: (rt) => rt.hotelId === hotel.id && rt.name === roomType.name,
        });

        if (!existing) {
          await db.insert(roomTypes).values({
            hotelId: hotel.id,
            name: roomType.name,
            description: roomType.description,
            capacity: roomType.capacity,
            pricePerNight: roomType.pricePerNight.toString(),
          });
          console.log(`  ✓ ${roomType.name} en ${hotel.name}`);
          insertedCount++;
        } else {
          existingCount++;
        }
      }
    }

    console.log(`\n✅ Seed completado: ${insertedCount} tipos de habitación insertados, ${existingCount} ya existían`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
}

seedHotels();