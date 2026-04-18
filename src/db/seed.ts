import { db } from "./index";
import { hotels, hotelImages, roomTypes, users } from "./schema";
import { eq } from "drizzle-orm";

// ─── Imágenes de Unsplash por categoría (URLs estables, sin API key) ────────
const HOTEL_DATA = [
  {
    name: "Casa Palacio San Cristóbal",
    slug: "casa-palacio-san-cristobal",
    description:
      "Un palacio colonial del siglo XVII convertido en hotel boutique de lujo. Sus muros de piedra, patios interiores con fuentes y habitaciones decoradas con arte original crean una experiencia única en el corazón histórico.",
    locationCity: "Cartagena",
    locationCountry: "Colombia",
    address: "Calle del Cuartel 9-88, Centro Histórico",
    latitude: 10.4236,
    longitude: -75.5503,
    category: "BOUTIQUE" as const,
    starRating: 5,
    images: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
        altText: "Fachada colonial de Casa Palacio San Cristóbal",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
        altText: "Piscina interior con arcos coloniales",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80",
        altText: "Suite con decoración colonial y arte original",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
        altText: "Patio interior con fuente y vegetación tropical",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Colonial",
        description: "Habitación con techos altos, vigas de madera y vista al patio interior.",
        capacity: 2,
        pricePerNight: "180000",
        currency: "CLP",
        totalRooms: 6,
        amenities: ["Aire acondicionado", "WiFi", "Minibar", "Caja fuerte", "TV 4K"],
      },
      {
        name: "Suite Marqués",
        description: "Suite con sala de estar independiente, bañera de mármol y balcón privado con vistas a la ciudad amurallada.",
        capacity: 2,
        pricePerNight: "320000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Aire acondicionado", "WiFi", "Minibar", "Bañera de mármol", "Balcón privado", "Mayordomo", "Desayuno incluido"],
      },
      {
        name: "Penthouse Real",
        description: "Planta completa con terraza panorámica de 360°, jacuzzi exterior y acceso exclusivo en ascensor privado.",
        capacity: 4,
        pricePerNight: "680000",
        currency: "CLP",
        totalRooms: 1,
        amenities: ["Ascensor privado", "Jacuzzi exterior", "Terraza 360°", "Cocina equipada", "Butler 24h", "Transfer aeropuerto", "Desayuno incluido"],
      },
    ],
  },
  {
    name: "Refugio Bosque Maitén",
    slug: "refugio-bosque-maiten",
    description:
      "Inmerso en un bosque de maitenes centenarios a orillas del lago Todos los Santos, este refugio eco-boutique combina arquitectura de madera nativa con confort contemporáneo. Desconéctate completamente en la Patagonia chilena.",
    locationCity: "Puerto Varas",
    locationCountry: "Chile",
    address: "Camino Lago Todos los Santos km 12, Ensenada",
    latitude: -41.2128,
    longitude: -72.5886,
    category: "ECO" as const,
    starRating: 4,
    images: [
      {
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
        altText: "Refugio de madera entre árboles nativos con vista al lago",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
        altText: "Terraza con vista a los volcanes y lago",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80",
        altText: "Interior de cabaña con chimenea y materiales naturales",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
        altText: "Sendero de madera entre el bosque nativo",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Cabaña del Bosque",
        description: "Cabaña individual con chimenea a leña, deck privado y hamaca entre los árboles.",
        capacity: 2,
        pricePerNight: "145000",
        currency: "CLP",
        totalRooms: 5,
        amenities: ["Chimenea a leña", "Deck privado", "WiFi satelital", "Ropa de cama térmica", "Kit de trekking"],
      },
      {
        name: "Suite Lago",
        description: "Suite con ventanal panorámico al lago, bañera de inmersión y sauna de cedro privado.",
        capacity: 2,
        pricePerNight: "265000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Vista al lago", "Sauna privado", "Bañera de inmersión", "WiFi satelital", "Desayuno gourmet incluido", "Kayaks incluidos"],
      },
      {
        name: "Loft Canopy",
        description: "Plataforma elevada entre las copas de los árboles con cama king, telescopio y acceso propio por pasarela suspendida.",
        capacity: 2,
        pricePerNight: "380000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Pasarela suspendida", "Telescopio", "Bañera exterior", "Desayuno a la cabaña", "Guía de naturaleza privado"],
      },
    ],
  },
  {
    name: "Hotel Azul Paracas",
    slug: "hotel-azul-paracas",
    description:
      "Frente a la Reserva Nacional de Paracas, este boutique de playa ofrece vistas al océano Pacífico y acceso directo a la bahía. Arquitectura contemporánea con influencias andinas y una propuesta gastronómica basada en pesca artesanal del día.",
    locationCity: "Paracas",
    locationCountry: "Perú",
    address: "Av. Paracas s/n, Bahía de Paracas",
    latitude: -13.8317,
    longitude: -76.2509,
    category: "BEACH" as const,
    starRating: 5,
    images: [
      {
        url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80",
        altText: "Hotel Azul Paracas con vista panorámica al Pacífico",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
        altText: "Piscina infinity con vista al océano al atardecer",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=1200&q=80",
        altText: "Habitación con terraza y vista al mar",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
        altText: "Restaurante de mariscos con pescados del día",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Mar",
        description: "Habitación con balcón privado y vista frontal al Pacífico y la Reserva de Paracas.",
        capacity: 2,
        pricePerNight: "220000",
        currency: "CLP",
        totalRooms: 8,
        amenities: ["Balcón con vista al mar", "Aire acondicionado", "WiFi", "Minibar", "Télescope de playa"],
      },
      {
        name: "Suite Bahía",
        description: "Suite esquinera con terraza envolvente sobre la bahía, sala de estar y bañera exenta frente al mar.",
        capacity: 2,
        pricePerNight: "390000",
        currency: "CLP",
        totalRooms: 4,
        amenities: ["Terraza envolvente", "Bañera exenta", "Sala de estar", "Servicio de playa incluido", "Desayuno incluido"],
      },
      {
        name: "Villa Islas Ballestas",
        description: "Villa independiente con piscina privada, acceso directo a la playa y chef privado bajo demanda.",
        capacity: 6,
        pricePerNight: "850000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Piscina privada", "Acceso directo playa", "Chef privado", "3 habitaciones", "Embarcación privada incluida", "All-inclusive"],
      },
    ],
  },
  {
    name: "Puna Lodge Atacama",
    slug: "puna-lodge-atacama",
    description:
      "A 2.400 metros de altitud en el desierto más árido del mundo, este lodge de lujo ofrece experiencias astronómicas únicas. Arquitectura de adobe y piedra volcánica que regula la temperatura naturalmente. Expediciones privadas al Salar de Atacama incluidas.",
    locationCity: "San Pedro de Atacama",
    locationCountry: "Chile",
    address: "Camino Pukará 4, Ayllu de Yaye",
    latitude: -22.9087,
    longitude: -68.1998,
    category: "LUXURY" as const,
    starRating: 5,
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
        altText: "Puna Lodge al atardecer con el volcán Licancabur de fondo",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80",
        altText: "Cielo estrellado sobre el desierto de Atacama",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80",
        altText: "Piscina caliente exterior rodeada de adobe y cactus",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200&q=80",
        altText: "Habitación de adobe con luz natural y vista al desierto",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Adobe",
        description: "Habitación construida en adobe con regulación térmica natural, techo de bóveda y ventana cenital para observación nocturna desde la cama.",
        capacity: 2,
        pricePerNight: "310000",
        currency: "CLP",
        totalRooms: 8,
        amenities: ["Ventana cenital", "Control térmico natural", "WiFi", "Telescopio personal", "Excursión Salar incluida"],
      },
      {
        name: "Suite Astronómica",
        description: "Suite con domo de cristal retráctil sobre la cama para observar el cielo nocturno. Incluye sesión privada con astrónomo residente.",
        capacity: 2,
        pricePerNight: "520000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Domo retráctil", "Astrónomo privado", "Jacuzzi exterior", "Desayuno andino incluido", "Expedición privada 4x4"],
      },
      {
        name: "Casita del Salar",
        description: "Casita independiente de 80m² con patio privado amurallado, ducha exterior y acceso exclusivo a piscina termal geotérmica.",
        capacity: 2,
        pricePerNight: "480000",
        currency: "CLP",
        totalRooms: 4,
        amenities: ["Patio privado", "Ducha exterior", "Piscina termal exclusiva", "Bicicletas incluidas", "Cena bajo las estrellas incluida", "Todo incluido"],
      },
    ],
  },
  {
    name: "Posada del Ángel Buenos Aires",
    slug: "posada-del-angel-buenos-aires",
    description:
      "Una casona porteña de 1910 en el barrio de Palermo Hollywood transformada en boutique urbano. Techos de madera originales, pisos de mosaico hidráulico y jardín interior secreto. A pasos de los mejores restaurantes y galerías de arte contemporáneo de Buenos Aires.",
    locationCity: "Buenos Aires",
    locationCountry: "Argentina",
    address: "Thames 2220, Palermo Hollywood",
    latitude: -34.5855,
    longitude: -58.4351,
    category: "CITY" as const,
    starRating: 4,
    images: [
      {
        url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
        altText: "Fachada art nouveau de la Posada del Ángel en Palermo",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
        altText: "Jardín interior secreto con vegetación y fuente",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80",
        altText: "Habitación con pisos de mosaico hidráulico originales",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=1200&q=80",
        altText: "Bar de la posada con botillería argentina curada",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Porteña",
        description: "Habitación con piso de mosaico hidráulico original, ventanas de guillotina y vista al jardín interior.",
        capacity: 2,
        pricePerNight: "98000",
        currency: "CLP",
        totalRooms: 7,
        amenities: ["WiFi", "Aire acondicionado", "Smart TV", "Desayuno incluido", "Nespresso"],
      },
      {
        name: "Suite Tango",
        description: "Suite duplex con biblioteca privada, sala de estar en planta baja y dormitorio en altillo bajo los techos originales de 1910.",
        capacity: 2,
        pricePerNight: "185000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Duplex", "Biblioteca privada", "Bañera clásica", "Desayuno incluido", "Botella de Malbec de bienvenida", "City tour incluido"],
      },
      {
        name: "Estudio Jardín",
        description: "Estudio de planta baja con acceso directo al jardín secreto, kitchenette y terraza privada con parrilla.",
        capacity: 3,
        pricePerNight: "162000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Acceso jardín privado", "Kitchenette", "Parrilla privada", "WiFi", "Bicicletas incluidas"],
      },
    ],
  },
  {
    name: "Hacienda Montecillo",
    slug: "hacienda-montecillo",
    description:
      "Hacienda cafetalera del siglo XIX enclavada entre montañas a 1.800 metros de altitud en el Eje Cafetero. Los huéspedes pueden participar en la cosecha y proceso del café de origen. Spa de barro volcánico y vistas a los valles de guaduales.",
    locationCity: "Salento",
    locationCountry: "Colombia",
    address: "Vereda El Bosque, Km 4 vía Cocora",
    latitude: 4.6388,
    longitude: -75.5713,
    category: "MOUNTAIN" as const,
    starRating: 4,
    images: [
      {
        url: "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=1200&q=80",
        altText: "Hacienda Montecillo entre cafetales y montañas",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80",
        altText: "Valle de Cocora con palmas de cera al amanecer",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1595521624969-7cce5b3a71e9?w=1200&q=80",
        altText: "Proceso artesanal del café en la hacienda",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80",
        altText: "Spa de barro volcánico con vistas al valle",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Cafetal",
        description: "Habitación con hamaca en balcón privado con vista a los cafetales y acceso a la degustación de café de origen diaria.",
        capacity: 2,
        pricePerNight: "115000",
        currency: "CLP",
        totalRooms: 8,
        amenities: ["Balcón privado", "Hamaca", "Cata de café diaria", "WiFi", "Desayuno cafetero incluido"],
      },
      {
        name: "Suite Hacienda",
        description: "Suite en la casa principal con mobiliario antigo restaurado, bañera de pie y acceso al tour de café privado con el caficultor.",
        capacity: 2,
        pricePerNight: "210000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Mobiliario antiguo", "Bañera de pie", "Tour privado caficultor", "Cena hacienda incluida", "Spa acceso ilimitado"],
      },
      {
        name: "Cabaña Guadual",
        description: "Cabaña construida en guadua (bambú andino) certificada con diseño bioclimático, jacuzzi exterior y vista a las palmas de cera.",
        capacity: 4,
        pricePerNight: "295000",
        currency: "CLP",
        totalRooms: 4,
        amenities: ["Construcción en guadua", "Jacuzzi exterior", "Vista palmas de cera", "Cocina equipada", "Acceso caballo incluido", "Desayuno incluido"],
      },
    ],
  },
];

// ─── Seed principal ──────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log("🌍 Iniciando seed de Hoteles Boutique...\n");

    // Obtener propietario
    const owner = await db.query.users.findFirst();
    if (!owner) {
      console.error("❌ No hay usuarios en la base de datos. Crea uno primero.");
      process.exit(1);
    }
    console.log(`✓ Propietario: ${owner.email}\n`);

    let hotelesInsertados = 0;
    let hotelesExistentes = 0;
    let imagenesInsertadas = 0;
    let habitacionesInsertadas = 0;

    for (const data of HOTEL_DATA) {
      // Verificar si ya existe
      const existing = await db.query.hotels.findFirst({
        where: eq(hotels.slug, data.slug),
      });

      let hotelId: string;

      if (existing) {
        hotelId = existing.id;
        hotelesExistentes++;
        console.log(`⏭️  Hotel ya existe: ${data.name}`);
      } else {
        // Insertar hotel
        const [hotel] = await db
          .insert(hotels)
          .values({
            ownerId: owner.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            locationCity: data.locationCity,
            locationCountry: data.locationCountry,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            category: data.category,
            starRating: data.starRating,
            active: true,
          })
          .returning({ id: hotels.id });

        hotelId = hotel.id;
        hotelesInsertados++;
        console.log(`✅ Hotel insertado: ${data.name} (${data.locationCity}, ${data.locationCountry})`);
      }

      // Insertar imágenes si no existen
      for (const img of data.images) {
        const existingImg = await db.query.hotelImages.findFirst({
          where: eq(hotelImages.url, img.url),
        });

        if (!existingImg) {
          await db.insert(hotelImages).values({
            hotelId,
            url: img.url,
            altText: img.altText,
            isCover: img.isCover,
            sortOrder: img.sortOrder,
          });
          imagenesInsertadas++;
          console.log(`   📸 Imagen: ${img.altText?.slice(0, 50)}...`);
        }
      }

      // Insertar tipos de habitación si no existen
      for (const rt of data.roomTypes) {
        const existingRt = await db.query.roomTypes.findFirst({
          where: (r) => eq(r.hotelId, hotelId) && eq(r.name, rt.name),
        });

        if (!existingRt) {
          await db.insert(roomTypes).values({
            hotelId,
            name: rt.name,
            description: rt.description,
            capacity: rt.capacity,
            pricePerNight: rt.pricePerNight,
            currency: rt.currency,
            totalRooms: rt.totalRooms,
            amenities: rt.amenities,
          });
          habitacionesInsertadas++;
          console.log(`   🛏️  Habitación: ${rt.name} — $${Number(rt.pricePerNight).toLocaleString("es-CL")} CLP/noche`);
        }
      }

      console.log("");
    }

    console.log("─".repeat(50));
    console.log(`✅ Seed completado exitosamente:`);
    console.log(`   🏨 Hoteles nuevos:       ${hotelesInsertados}`);
    console.log(`   ⏭️  Hoteles existentes:   ${hotelesExistentes}`);
    console.log(`   📸 Imágenes insertadas:  ${imagenesInsertadas}`);
    console.log(`   🛏️  Habitaciones nuevas:  ${habitacionesInsertadas}`);
    console.log("─".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
}

seed();
