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
    <main className="min-h-screen bg-[#fafafa]">
      {/* Header Glassmórfico */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href={`/${locale}/hotels`} className="text-xl font-bold tracking-tight text-gray-900">
            Hoteles<span className="text-gray-400 font-light">Boutique</span>
          </a>
          <div className="flex gap-6 items-center">
            {session?.user ? (
              <>
                <a href={`/${locale}/bookings`} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Mis reservas</a>
                <a href={`/${locale}/profile`}  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Mi Perfil</a>
                <a href="/api/auth/signout"       className="text-sm font-medium bg-gray-100 text-gray-600 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">Cerrar sesión</a>
              </>
            ) : (
              <a href={`/${locale}/auth/login`} className="text-sm font-medium bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all shadow-md hover:shadow-lg">
                Iniciar sesión
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section Premium */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Encuentra tu hotel ideal
          </h1>
          <p className="text-lg text-gray-500 font-light">
            Experiencias exclusivas, arquitectura única y atención personalizada en los destinos más hermosos.
          </p>
        </div>

        {/* Filtros (Client Component pequeño) */}
        <Suspense>
          <HotelFilters />
        </Suspense>

        {/* Grid de hoteles */}
        {hotels.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-lg mb-4">No se encontraron hoteles con estos filtros.</p>
            <a href={`/${locale}/hotels`} className="text-sm font-medium text-gray-900 underline hover:text-gray-600 transition-colors">
              Borrar filtros
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <a 
                key={hotel.id}
                href={`/${locale}/hotels/${hotel.slug}`} 
                className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-64 bg-gray-100 relative overflow-hidden">
                  {hotel.images?.[0] && (
                    <img
                      src={hotel.images[0].url}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  {/* Badge Categoría */}
                  <div className="absolute top-4 right-4 backdrop-blur-md bg-white/70 shadow-sm px-3 py-1.5 rounded-full border border-white/50">
                    <span className={`text-xs font-semibold tracking-wide uppercase ${CAT_COLORS[hotel.category] ?? "text-gray-600"}`}>
                      {CAT_LABELS[hotel.category] ?? hotel.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">{hotel.name}</h2>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="text-sm font-bold text-gray-900">{hotel.avgRating ?? hotel.starRating}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6 font-medium">{hotel.locationCity}, {hotel.locationCountry}</p>
                  
                  <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Desde</p>
                      {hotel.minPricePerNight ? (
                        <p className="text-lg font-bold text-gray-900">
                          ${hotel.minPricePerNight.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500"> /noche</span>
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-gray-400">Consultar</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                      <span className="text-lg leading-none">→</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}