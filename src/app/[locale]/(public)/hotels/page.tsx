import { Suspense } from "react";
import { getHotels } from "@/services/hotel.service";
import { auth } from "@/lib/auth/nextauth.config";
import HotelFilters from "@/components/HotelFilters";
import type { HotelCategory } from "@/types/domain";

// Server Component: los datos se cargan en el servidor —
// el browser recibe HTML completo sin skeleton de carga.
export const dynamic = "force-dynamic"; // revalidar en cada request (filtros por URL)

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

const CAT_COLORS: Record<string, string> = {
  LUXURY: "bg-purple-50 text-purple-700 border-purple-200",
  BOUTIQUE: "bg-pink-50 text-pink-700 border-pink-200",
  ECO: "bg-green-50 text-green-700 border-green-200",
  BEACH: "bg-blue-50 text-blue-700 border-blue-200",
  MOUNTAIN: "bg-amber-50 text-amber-700 border-amber-200",
  CITY: "bg-gray-100 text-gray-600 border-gray-200",
};

function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "text-xs" : "text-sm";
  return (
    <span className={`${cls} text-amber-400`}>
      {"★".repeat(Math.round(n))}
      <span className="text-gray-200">{"★".repeat(5 - Math.round(n))}</span>
    </span>
  );
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; category?: string; maxPrice?: string; minStars?: string; page?: string }>;
}

export default async function HotelsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  // Carga de datos directamente en el servidor — sin fetch round-trip
  const [session, hotels] = await Promise.all([
    auth(),
    getHotels({
      city:      sp.city,
      category:  sp.category as HotelCategory | undefined,
      maxPrice:  sp.maxPrice  ? parseFloat(sp.maxPrice)  : undefined,
      minStars:  sp.minStars  ? parseInt(sp.minStars)    : undefined,
      page:      sp.page      ? parseInt(sp.page)        : 1,
      limit:     12,
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href={`/${locale}/hotels`} className="text-lg font-semibold text-gray-900">Hoteles Boutique</a>
          <div className="flex gap-4">
            {session?.user && (
              <>
                <a href={`/${locale}/bookings`} className="text-sm text-gray-500 hover:text-gray-900">Mis reservas</a>
                <a href={`/${locale}/profile`}  className="text-sm text-gray-500 hover:text-gray-900">Mi Perfil</a>
                <a href="/api/auth/signout"       className="text-sm text-gray-500 hover:text-gray-900">Cerrar sesión</a>
              </>
            )}
            {!session?.user && (
              <a href={`/${locale}/auth/login`} className="text-sm text-gray-500 hover:text-gray-900">Cuenta</a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Encuentra tu hotel ideal</h1>
          <p className="text-gray-400 mb-6">Experiencias exclusivas y personalizadas</p>
        </div>

        {/* Filtros (Client Component pequeño) */}
        <Suspense>
          <HotelFilters />
        </Suspense>

        {/* Grid de hoteles — renderizado en el servidor */}
        {hotels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No se encontraron hoteles con estos filtros</p>
            <a href={`/${locale}/hotels`} className="text-sm text-gray-900 underline">
              Ver todos los hoteles
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all group"
              >
                <a href={`/${locale}/hotels/${hotel.slug}`} className="block">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {hotel.images?.[0] && (
                      <img
                        src={hotel.images[0].url}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${CAT_COLORS[hotel.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {CAT_LABELS[hotel.category] ?? hotel.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-gray-900 mb-0.5">{hotel.name}</h2>
                    <p className="text-xs text-gray-400 mb-2">{hotel.locationCity}, {hotel.locationCountry}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Stars n={hotel.starRating} size="xs" />
                        {hotel.avgRating && (
                          <span className="text-xs text-gray-500">{hotel.avgRating} ★</span>
                        )}
                      </div>
                      {hotel.minPricePerNight && (
                        <span className="text-sm font-semibold text-gray-900">
                          ${hotel.minPricePerNight.toLocaleString()}
                          <span className="text-xs font-normal text-gray-400">/noche</span>
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}