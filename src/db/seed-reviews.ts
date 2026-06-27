/**
 * seed-reviews.ts
 * Seeds realistic varied reviews (3-5 stars) for all hotels.
 * Uses raw SQL to bypass the bookingId FK by creating fake booking records.
 */
import { db } from "./index";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
config({ path: ".env" });

const COMMENTS_BY_RATING: Record<number, string[]> = {
  5: [
    "Una experiencia absolutamente increíble. El personal fue excepcional y las instalaciones superaron todas mis expectativas. Definitivamente volveré.",
    "El hotel más hermoso en el que he estado. Cada detalle fue cuidado con esmero. La gastronomía fue exquisita y la vista, impresionante.",
    "Servicio impecable de principio a fin. El spa fue una experiencia transformadora. Lo recomiendo sin dudarlo a cualquiera que busque el lujo real.",
    "Perfecto para nuestra luna de miel. El equipo hizo todo lo posible para que nuestra estadía fuera mágica. ¡Gracias por los detalles sorpresa!",
    "Superó mis expectativas en todos los sentidos. La habitación era espaciosa, la cama cómoda y el desayuno simplemente espectacular.",
  ],
  4: [
    "Muy buena experiencia en general. La ubicación es excelente y el personal muy amable. Solo le faltó un poco más de atención en el desayuno.",
    "Hotel encantador con un diseño único. La habitación era cómoda aunque un poco pequeña para dos maletas grandes. El restaurante, excelente.",
    "Gran relación calidad-precio. Todo estaba limpio y bien mantenido. La piscina un poco fría pero el ambiente general fue muy agradable.",
    "Nos gustó mucho la estética boutique del lugar. El personal fue muy atento. Solo un pequeño detalle: el WiFi en la habitación tardó en conectar.",
    "Muy recomendable. El check-in fue rápido, la habitación estaba perfecta y el desayuno incluido fue una buena sorpresa. Volvería sin dudarlo.",
  ],
  3: [
    "Experiencia correcta pero no extraordinaria. El hotel tiene potencial pero le falta pulir algunos detalles en el servicio. La ubicación es buena.",
    "La habitación era básica pero limpia. El personal podría ser más proactivo. La zona es conveniente pero hay ruido de la calle en las noches.",
    "Esperaba un poco más dado el precio. El desayuno era repetitivo y el spa tenía un horario muy limitado. La cama sí era muy cómoda.",
    "Regular en general. El check-in demoró más de lo esperado y la habitación no estaba lista al llegar. El jardín es el punto más destacado.",
    "Tres estrellas porque cumple con lo prometido pero sin grandes sorpresas. Para un viaje de trabajo está bien, para una celebración buscaría otro.",
  ],
  2: [
    "Algo decepcionante. La foto del hotel en la web no refleja el estado actual de las instalaciones. El personal intentó ayudar pero con muchas limitaciones.",
    "Tuvimos problemas con el agua caliente y tardaron casi dos horas en resolverlo. La ubicación es buena pero el servicio necesita mejorar bastante.",
  ],
};

// Distribution: heavily weighted toward 4-5 stars with some 3s and very few 2s
const RATING_POOL = [5,5,5,5,4,4,4,4,4,4,3,3,3,2,5,5,4,4,4,3,5,4,4,5,4,3,5,5,4,4];

function randEl<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function seed() {
  console.log("🌱 Seeding varied reviews for all hotels...");

  // Get all hotels
  const allHotels = await db.execute(sql`SELECT id FROM hotels WHERE active = true`);
  console.log(`Found ${allHotels.length} active hotels.`);

  // Get a guest user to attach reviews to
  const users = await db.execute(sql`SELECT id FROM users LIMIT 5`);
  if (!users.length) { console.error("No users found."); process.exit(1); }

  // Delete existing reviews so we start fresh with varied ratings
  await db.execute(sql`DELETE FROM reviews`);
  console.log("Cleared existing reviews.");

  // We also need bookings to reference — get existing completed bookings with their hotel via room_type
  const existingBookings = await db.execute(sql`
    SELECT b.id, b.guest_id, rt.hotel_id
    FROM bookings b
    JOIN room_types rt ON rt.id = b.room_type_id
    LIMIT 400
  `);
  const bookingsByHotel = new Map<string, {id: string; guestId: string}[]>();
  for (const bk of existingBookings) {
    const hid = bk.hotel_id as string;
    if (!bookingsByHotel.has(hid)) bookingsByHotel.set(hid, []);
    bookingsByHotel.get(hid)!.push({ id: bk.id as string, guestId: bk.guest_id as string });
  }

  let inserted = 0;
  const reviewsPerHotel = 4; // 2-6 reviews per hotel

  for (const hotel of allHotels) {
    const hotelId = hotel.id as string;
    const count = rand(2, reviewsPerHotel);

    for (let i = 0; i < count; i++) {
      const overall = randEl(RATING_POOL);
      const service = Math.max(1, Math.min(5, overall + rand(-1, 1)));
      const cleanliness = Math.max(1, Math.min(5, overall + rand(-1, 1)));
      const location = Math.max(1, Math.min(5, overall + rand(-1, 1)));
      const comment = randEl(COMMENTS_BY_RATING[overall] ?? COMMENTS_BY_RATING[3]);

      // Use a real booking if available, otherwise create a synthetic one
      let bookingId: string;
      let guestId: string;

      const existingForHotel = bookingsByHotel.get(hotelId);
      if (existingForHotel && existingForHotel.length > i) {
        bookingId = existingForHotel[i].id;
        guestId = existingForHotel[i].guestId;
      } else {
        // Create a synthetic COMPLETED booking for this hotel
        const guestUser = users[rand(0, users.length - 1)];
        guestId = guestUser.id as string;

        // Get a room type for this hotel
        const roomTypes = await db.execute(sql`SELECT id FROM room_types WHERE hotel_id = ${hotelId} LIMIT 1`);
        if (!roomTypes.length) continue;
        const roomTypeId = roomTypes[0].id as string;

        const checkIn = new Date(Date.now() - rand(30, 365) * 86400000).toISOString().split("T")[0];
        const checkOut = new Date(new Date(checkIn).getTime() + rand(1, 7) * 86400000).toISOString().split("T")[0];

        const newBooking = await db.execute(sql`
          INSERT INTO bookings (guest_id, room_type_id, check_in, check_out, guests_count, total_price, status)
          VALUES (${guestId}, ${roomTypeId}, ${checkIn}::date, ${checkOut}::date, ${rand(1,3)}, ${rand(80000,400000)}, 'COMPLETED')
          RETURNING id
        `);
        bookingId = newBooking[0].id as string;

        // Cache this booking
        if (!bookingsByHotel.has(hotelId)) bookingsByHotel.set(hotelId, []);
        bookingsByHotel.get(hotelId)!.push({ id: bookingId, guestId });
      }

      await db.execute(sql`
        INSERT INTO reviews (booking_id, guest_id, hotel_id, rating_overall, rating_service, rating_cleanliness, rating_location, comment, created_at)
        VALUES (
          ${bookingId}, ${guestId}, ${hotelId},
          ${overall}, ${service}, ${cleanliness}, ${location},
          ${comment},
          NOW() - (${rand(1, 300)} || ' days')::interval
        )
      `);

      inserted++;
    }

    if (inserted % 100 === 0) console.log(`✅ ${inserted} reviews inserted so far...`);
  }

  console.log(`\n🎉 Done! Inserted ${inserted} reviews across ${allHotels.length} hotels.`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
