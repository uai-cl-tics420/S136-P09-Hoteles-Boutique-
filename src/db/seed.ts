import { db } from "./index";
import { hotels, hotelImages, roomTypes, users } from "./schema";
import { eq } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// URLs de Unsplash — formato estable sin API key:
//   https://images.unsplash.com/photo-<ID>?w=1200&q=80
//
// Cada foto fue elegida manualmente para coincidir con el tipo real de hotel:
//   fachadas coloniales, habitaciones boutique, piscinas, naturaleza, etc.
// ─────────────────────────────────────────────────────────────────────────────

const HOTEL_DATA = [
  // ── 1. BOUTIQUE COLONIAL ── Cartagena, Colombia ───────────────────────────
  {
    name: "Casa Palacio San Cristóbal",
    slug: "casa-palacio-san-cristobal",
    description:
      "Un palacio colonial del siglo XVII convertido en hotel boutique de lujo en el corazón histórico de Cartagena de Indias. Sus muros de piedra coralina, patios interiores con fuentes de mármol y habitaciones decoradas con arte original colombiano crean una experiencia cultural única. A pasos de la Plaza de los Coches y la muralla colonial, el hotel ofrece acceso privilegiado a la ciudad más romántica del Caribe.",
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
        altText: "Patio colonial con arcos de piedra, vegetación tropical y fuente central",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
        altText: "Piscina interior con arcos coloniales iluminados al atardecer",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80",
        altText: "Suite colonial con cama dosel, techos de viga y arte original colombiano",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
        altText: "Terraza con vista panorámica a las cúpulas y tejados del Centro Histórico",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Colonial",
        description:
          "Habitación con techos altos de viga, pisos de baldosa española y vista al patio interior con fuente. Baño en mármol blanco con ducha de lluvia.",
        capacity: 2,
        pricePerNight: "180000",
        currency: "CLP",
        totalRooms: 6,
        amenities: ["Aire acondicionado", "WiFi", "Minibar", "Caja fuerte", "TV 4K", "Ducha de lluvia"],
      },
      {
        name: "Suite Marqués",
        description:
          "Suite con sala de estar independiente decorada con antigüedades, bañera de mármol exenta y balcón privado con vistas a la ciudad amurallada. Butler disponible 12h.",
        capacity: 2,
        pricePerNight: "320000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Bañera de mármol exenta", "Balcón privado", "Butler 12h", "Desayuno incluido", "Minibar premium", "WiFi"],
      },
      {
        name: "Penthouse Real",
        description:
          "Planta completa con terraza panorámica de 360° con jacuzzi exterior, sala de estar, comedor privado y acceso exclusivo por ascensor. Vistas al mar Caribe y a la muralla colonial.",
        capacity: 4,
        pricePerNight: "680000",
        currency: "CLP",
        totalRooms: 1,
        amenities: ["Jacuzzi exterior", "Terraza 360°", "Cocina equipada", "Butler 24h", "Transfer aeropuerto", "Desayuno incluido"],
      },
    ],
  },

  // ── 2. ECO LODGE ── Puerto Varas, Chile ───────────────────────────────────
  {
    name: "Refugio Bosque Maitén",
    slug: "refugio-bosque-maiten",
    description:
      "Inmerso en un bosque milenario de maitenes a orillas del lago Todos los Santos, este eco-lodge boutique combina arquitectura en madera nativa con un confort contemporáneo de alta gama. Construido respetando el ecosistema original de la Patagonia chilena, ofrece vistas directas al volcán Osorno y al volcán Calbuco. Electricidad 100% solar, cocina de productos locales y acceso directo al lago para kayak y pesca.",
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
        altText: "Refugio de madera nativa reflejado en el lago Todos los Santos al amanecer",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
        altText: "Terraza con sillas de madera y vista al volcán Osorno nevado sobre el lago",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80",
        altText: "Interior de cabaña con chimenea a leña, pieles de oveja y madera natural",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
        altText: "Piscina al aire libre entre el bosque nativo con agua termal del volcán",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Cabaña del Bosque",
        description:
          "Cabaña individual con chimenea a leña, deck privado con hamaca colgante entre los árboles y vista parcial al lago. Perfecta para reconectar con la naturaleza patagónica.",
        capacity: 2,
        pricePerNight: "145000",
        currency: "CLP",
        totalRooms: 5,
        amenities: ["Chimenea a leña", "Deck privado", "WiFi satelital", "Ropa de cama térmica", "Kit trekking"],
      },
      {
        name: "Suite Lago",
        description:
          "Suite con ventanal panorámico al lago y al volcán Osorno, bañera de inmersión con vista al bosque y sauna de cedro privado con acceso directo desde la habitación.",
        capacity: 2,
        pricePerNight: "265000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Vista al lago y volcán", "Sauna privado", "Bañera de inmersión", "Desayuno gourmet", "Kayaks incluidos", "WiFi satelital"],
      },
      {
        name: "Loft Canopy",
        description:
          "Plataforma elevada a 8 metros entre las copas de los árboles con acceso por pasarela suspendida. Cama king con techo de vidrio, telescopio astronómico y bañera exterior con vista a la cordillera nevada.",
        capacity: 2,
        pricePerNight: "380000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Pasarela suspendida", "Telescopio", "Bañera exterior", "Desayuno en cabaña", "Guía naturaleza privado"],
      },
    ],
  },

  // ── 3. BEACH ── Paracas, Perú ─────────────────────────────────────────────
  {
    name: "Hotel Azul Paracas",
    slug: "hotel-azul-paracas",
    description:
      "Situado en primera línea frente a la Reserva Nacional de Paracas, este boutique de playa es uno de los alojamientos más exclusivos del litoral peruano. Arquitectura contemporánea con influencias andinas, grandes ventanales al Pacífico y una propuesta gastronómica basada en la pesca artesanal del día traída directamente desde el muelle. El punto de partida ideal para explorar las Islas Ballestas y el desierto que llega hasta el mar.",
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
        altText: "Hotel Azul Paracas con fachada blanca y vista panorámica al Pacífico sur",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
        altText: "Piscina infinity al borde del océano con el atardecer sobre el Pacífico",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=1200&q=80",
        altText: "Habitación con terraza privada y hamaca frente al mar de Paracas",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
        altText: "Restaurante de ceviches y mariscos frescos con vista a la bahía",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Mar",
        description:
          "Habitación con balcón privado y vista frontal al océano Pacífico y la Reserva de Paracas. Decoración en tonos arena y azul cobalto con cerámica nazca original.",
        capacity: 2,
        pricePerNight: "220000",
        currency: "CLP",
        totalRooms: 8,
        amenities: ["Balcón vista al mar", "Aire acondicionado", "WiFi", "Minibar", "Binoculares"],
      },
      {
        name: "Suite Bahía",
        description:
          "Suite esquinera con terraza envolvente sobre la bahía de Paracas, sala de estar con sofás de lino y bañera exenta frente al ventanal al mar.",
        capacity: 2,
        pricePerNight: "390000",
        currency: "CLP",
        totalRooms: 4,
        amenities: ["Terraza envolvente", "Bañera exenta frente al mar", "Sala de estar", "Servicio de playa", "Desayuno incluido"],
      },
      {
        name: "Villa Islas Ballestas",
        description:
          "Villa independiente de 200m² con piscina privada climatizada, acceso directo a la playa privada y chef ejecutivo disponible bajo demanda. Incluye excursión privada en lancha a las Islas Ballestas.",
        capacity: 6,
        pricePerNight: "850000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Piscina privada climatizada", "Playa privada", "Chef privado", "3 habitaciones", "Lancha privada", "All-inclusive"],
      },
    ],
  },

  // ── 4. LUXURY DESERT ── Atacama, Chile ────────────────────────────────────
  {
    name: "Puna Lodge Atacama",
    slug: "puna-lodge-atacama",
    description:
      "A 2.400 metros de altitud en el desierto más árido del planeta, este lodge de lujo ofrece la experiencia de observación astronómica más exclusiva de Sudamérica. Construido en adobe y piedra volcánica local, la arquitectura regula naturalmente la temperatura extrema del desierto de Atacama. El astrónomo residente guía sesiones nocturnas privadas bajo el cielo más despejado del mundo. Expediciones en 4x4 al Salar de Atacama, Valle de la Luna y géiseres del Tatio incluidas.",
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
        altText: "Desierto de Atacama al atardecer con el volcán Licancabur nevado de fondo",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80",
        altText: "Vía Láctea sobre el desierto de Atacama, el cielo más estrellado del mundo",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80",
        altText: "Piscina caliente exterior rodeada de arquitectura de adobe y cactus gigantes",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200&q=80",
        altText: "Habitación de adobe con bóveda, ventana cenital y vista al desierto infinito",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Adobe",
        description:
          "Habitación construida en adobe con techo de bóveda que regula la temperatura naturalmente entre los extremos del desierto. Ventana cenital para observación nocturna desde la cama.",
        capacity: 2,
        pricePerNight: "310000",
        currency: "CLP",
        totalRooms: 8,
        amenities: ["Ventana cenital", "Adobe térmico natural", "WiFi", "Telescopio personal", "Excursión Salar incluida"],
      },
      {
        name: "Suite Astronómica",
        description:
          "Suite con domo de cristal borosilicato retráctil sobre la cama king para dormir bajo las estrellas del desierto. Incluye sesión privada con el astrónomo residente y jacuzzi exterior con vista al volcán.",
        capacity: 2,
        pricePerNight: "520000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Domo retráctil", "Astrónomo privado", "Jacuzzi exterior", "Desayuno andino", "Expedición 4x4 privada"],
      },
      {
        name: "Casita del Salar",
        description:
          "Casita independiente de 80m² con patio amurallado privado, ducha exterior de cobre bajo el cielo y acceso exclusivo a la piscina termal geotérmica del lodge. Cena romántica bajo las estrellas incluida.",
        capacity: 2,
        pricePerNight: "480000",
        currency: "CLP",
        totalRooms: 4,
        amenities: ["Patio privado amurallado", "Ducha exterior", "Piscina termal exclusiva", "Bicicletas", "Cena bajo estrellas", "Todo incluido"],
      },
    ],
  },

  // ── 5. CITY BOUTIQUE ── Buenos Aires, Argentina ───────────────────────────
  {
    name: "Posada del Ángel Buenos Aires",
    slug: "posada-del-angel-buenos-aires",
    description:
      "Una casona porteña de 1910 en el barrio de Palermo Hollywood, completamente restaurada en 2019 como hotel boutique urbano de 12 habitaciones. Conserva los techos de artesonado original, los pisos de mosaico hidráulico de la Belle Époque y el jardín interior secreto. A dos cuadras de las mejores parrillas y restaurantes de cocina de autor de Buenos Aires, y a 10 minutos a pie de los teatros del corredor cultural de Palermo.",
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
        altText: "Fachada art nouveau de la Posada del Ángel con balcones de hierro forjado",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
        altText: "Jardín interior secreto con fuente de azulejos, vegetación y mesa para desayuno",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80",
        altText: "Habitación con piso de mosaico hidráulico original, cama de bronce y ventana de guillotina",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=1200&q=80",
        altText: "Bar de la posada con botillería de vinos argentinos y ambiente de época",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Porteña",
        description:
          "Habitación con piso de mosaico hidráulico original de 1910, ventanas de guillotina al jardín interior y techo de escayola decorada. Desayuno criollo incluido en el jardín secreto.",
        capacity: 2,
        pricePerNight: "98000",
        currency: "CLP",
        totalRooms: 7,
        amenities: ["WiFi", "Aire acondicionado", "Smart TV", "Desayuno incluido", "Nespresso"],
      },
      {
        name: "Suite Tango",
        description:
          "Suite duplex con biblioteca privada de 300 volúmenes en planta baja, sala de estar y dormitorio en altillo bajo los techos de artesonado originales de 1910. Incluye clase de tango privada.",
        capacity: 2,
        pricePerNight: "185000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Duplex", "Biblioteca privada", "Bañera clásica", "Clase de tango", "Botella de Malbec", "City tour"],
      },
      {
        name: "Estudio Jardín",
        description:
          "Estudio de planta baja con puerta francesa al jardín secreto, kitchenette de línea y terraza privada con parrilla para asados en casa. Bicicletas de la posada incluidas para explorar Palermo.",
        capacity: 3,
        pricePerNight: "162000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Acceso jardín privado", "Kitchenette", "Parrilla privada", "WiFi", "Bicicletas incluidas"],
      },
    ],
  },

  // ── 6. MOUNTAIN COFFEE ── Salento, Colombia ───────────────────────────────
  {
    name: "Hacienda Montecillo",
    slug: "hacienda-montecillo",
    description:
      "Hacienda cafetalera del siglo XIX a 1.800 metros de altitud en el corazón del Eje Cafetero colombiano, declarado Patrimonio de la Humanidad por la UNESCO. Los huéspedes pueden participar activamente en la cosecha, beneficio y tueste del café de origen que lleva cuatro generaciones en la misma familia. Spa de barro volcánico del Nevado del Ruiz, vistas al Valle de Cocora con sus palmas de cera —el árbol nacional de Colombia— y gastronomía campesina de mercado.",
    locationCity: "Salento",
    locationCountry: "Colombia",
    address: "Vereda El Bosque, Km 4 vía Cocora",
    latitude: 4.6388,
    longitude: -75.5713,
    category: "MOUNTAIN" as const,
    starRating: 4,
    images: [
      {
        url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80",
        altText: "Vista aérea del Valle de Cocora con palmas de cera y montañas del Eje Cafetero",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=1200&q=80",
        altText: "Hacienda Montecillo entre cafetales en flor y la cordillera Central colombiana",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80",
        altText: "Manos cosechando granos de café cereza en los cafetales de la hacienda",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80",
        altText: "Spa de barro volcánico con piscinas termales y vista a los valles de guaduales",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Cafetal",
        description:
          "Habitación en la casa principal con hamaca en balcón privado con vista a los cafetales y a la cordillera. Incluye degustación de café de origen con barista de la hacienda cada mañana.",
        capacity: 2,
        pricePerNight: "115000",
        currency: "CLP",
        totalRooms: 8,
        amenities: ["Balcón privado", "Hamaca", "Cata de café diaria", "WiFi", "Desayuno cafetero"],
      },
      {
        name: "Suite Hacienda",
        description:
          "Suite en el ala histórica con mobiliario republicano restaurado, bañera de pie con patas de garras y acceso al tour privado de café con el caficultor de cuarta generación.",
        capacity: 2,
        pricePerNight: "210000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Mobiliario antiguo restaurado", "Bañera de pie", "Tour caficultor privado", "Cena en hacienda", "Spa ilimitado"],
      },
      {
        name: "Cabaña Guadual",
        description:
          "Cabaña de 60m² construida en guadua (bambú andino) certificada con diseño bioclimático, jacuzzi exterior con vista directa a las palmas de cera del Valle de Cocora y cocina equipada con productos locales.",
        capacity: 4,
        pricePerNight: "295000",
        currency: "CLP",
        totalRooms: 4,
        amenities: ["Guadua bioclimática", "Jacuzzi exterior", "Vista palmas de cera", "Cocina equipada", "Caballos incluidos", "Desayuno"],
      },
    ],
  },

  // ── 7. LUXURY VINEYARD ── Valle de Uco, Mendoza, Argentina ───────────────
  {
    name: "Lomas de Uco Wine Lodge",
    slug: "lomas-de-uco-wine-lodge",
    description:
      "Lodge de viñedos a 1.050 metros sobre el nivel del mar al pie de los Andes mendocinos, rodeado de 120 hectáreas de malbec, cabernet franc y torrontés de alta gama. El enólogo residente conduce degustaciones privadas en bodega subterránea con barricas de roble francés. El spa ofrece tratamientos únicos de vinoterapia con orujo y semillas de uva. Las habitaciones tienen vistas directas a la Cordillera Nevada y al viñedo —especialmente memorables al atardecer.",
    locationCity: "Tunuyán",
    locationCountry: "Argentina",
    address: "Ruta 94, km 14, Valle de Uco",
    latitude: -33.5741,
    longitude: -69.2109,
    category: "LUXURY" as const,
    starRating: 5,
    images: [
      {
        url: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80",
        altText: "Viñedos de malbec del Valle de Uco con la Cordillera de los Andes nevada al fondo",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
        altText: "Piscina infinity al atardecer con los viñedos y los Andes mendocinos como horizonte",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80",
        altText: "Bodega subterránea con hileras de barricas de roble para maduración del malbec",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1601918774516-2bbb9e44b86e?w=1200&q=80",
        altText: "Suite con ventanal panorámico al viñedo, chimenea y cama king con vista a los Andes",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación Viñedo",
        description:
          "Habitación con ventanal floor-to-ceiling a los viñedos y la cordillera nevada, mini-bodega privada con selección curada y acceso a la cata de bienvenida con el enólogo.",
        capacity: 2,
        pricePerNight: "285000",
        currency: "CLP",
        totalRooms: 12,
        amenities: ["Vista cordillera y viñedo", "Mini-bodega privada", "Cata diaria", "WiFi", "Desayuno incluido"],
      },
      {
        name: "Suite Malbec",
        description:
          "Suite de 60m² con chimenea de doble cara, bañera exenta con vista directa a los Andes y sesión privada de vinoterapia en el spa con tratamiento de orujo y aceite de pepita de uva.",
        capacity: 2,
        pricePerNight: "440000",
        currency: "CLP",
        totalRooms: 6,
        amenities: ["Chimenea doble cara", "Bañera exenta vista Andes", "Vinoterapia incluida", "Enólogo privado", "Desayuno y cena"],
      },
      {
        name: "Villa de los Andes",
        description:
          "Villa independiente de 120m² con plunge pool privada climatizada, bodega personal con 12 etiquetas premium seleccionadas por el sommelier y acceso a caballo a los viñedos al amanecer.",
        capacity: 4,
        pricePerNight: "720000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Plunge pool privada", "Bodega personal 12 etiquetas", "Paseos a caballo", "Chef privado", "Transfer Mendoza", "All-inclusive"],
      },
    ],
  },

  // ── 8. BOUTIQUE HISTÓRICO ── Cusco, Perú ──────────────────────────────────
  {
    name: "Casa Wayra Cusco",
    slug: "casa-wayra-cusco",
    description:
      "Casona del siglo XVI construida sobre cimientos incas de andesita en el barrio artesanal de San Blas, el más pintoresco del Cusco histórico. Diez habitaciones únicas decoradas con textiles aymaras de telar, cerámica qero y arte contemporáneo peruano de la galería Tupay. La terraza con vistas de 180° a los tejados coloniales y los Andes es el escenario del desayuno más memorable de Cusco. A 5 minutos a pie de la Plaza de Armas y junto a los mejores restaurantes de cocina novoandina.",
    locationCity: "Cusco",
    locationCountry: "Perú",
    address: "Cuesta San Blas 524, Barrio de San Blas",
    latitude: -13.5169,
    longitude: -71.9743,
    category: "BOUTIQUE" as const,
    starRating: 5,
    images: [
      {
        url: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&q=80",
        altText: "Vista panorámica de los tejados coloniales de Cusco y los Andes desde la terraza",
        isCover: true,
        sortOrder: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1200&q=80",
        altText: "Patio de piedra con arcos coloniales, flores andinas y banco de cantería",
        isCover: false,
        sortOrder: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80",
        altText: "Suite Inca con textiles aymaras, vigas coloniales y baño de piedra caliza",
        isCover: false,
        sortOrder: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200&q=80",
        altText: "Excursión privada a Machu Picchu al amanecer con guía arqueólogo de la casa",
        isCover: false,
        sortOrder: 3,
      },
    ],
    roomTypes: [
      {
        name: "Habitación San Blas",
        description:
          "Habitación con vista al barrio artesanal, vigas coloniales de cedro, calefacción radiante para las frías noches andinas y té de coca de bienvenida. Desayuno novoandino en terraza.",
        capacity: 2,
        pricePerNight: "155000",
        currency: "CLP",
        totalRooms: 5,
        amenities: ["Calefacción radiante", "WiFi", "Textiles artesanales", "Té de coca", "Desayuno andino"],
      },
      {
        name: "Suite Colonial",
        description:
          "Suite con sala de estar decorada con arte contemporáneo peruano original, chimenea de piedra y baño con bañera tallada en piedra volcánica andina. Incluye sesión de meditación andina al amanecer.",
        capacity: 2,
        pricePerNight: "260000",
        currency: "CLP",
        totalRooms: 3,
        amenities: ["Chimenea de piedra", "Bañera de piedra volcánica", "Arte peruano original", "Meditación andina", "Guía Machu Picchu"],
      },
      {
        name: "Ático Inca",
        description:
          "Ático con terraza privada sobre los tejados coloniales del Cusco, cama con dosel de textiles andinos de alta gama y mayordomo personal las 24h. Vista única a la catedral del Cusco y al horizonte andino.",
        capacity: 2,
        pricePerNight: "395000",
        currency: "CLP",
        totalRooms: 2,
        amenities: ["Terraza privada sobre tejados", "Mayordomo 24h", "Cama con dosel andino", "Transfer aeropuerto", "Valle Sagrado incluido", "All-inclusive"],
      },
    ],
  },
];

// ─── Seed principal ──────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log("🌍 Iniciando seed de Hoteles Boutique...\n");

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
      const existing = await db.query.hotels.findFirst({
        where: eq(hotels.slug, data.slug),
      });

      let hotelId: string;

      if (existing) {
        hotelId = existing.id;
        hotelesExistentes++;
        console.log(`⏭️  Hotel ya existe: ${data.name}`);
      } else {
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

      // Insertar imágenes si no existen ya para este hotel
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
          console.log(`   📸 ${img.altText?.slice(0, 60)}...`);
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
          console.log(
            `   🛏️  ${rt.name} — $${Number(rt.pricePerNight).toLocaleString("es-CL")} CLP/noche`
          );
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