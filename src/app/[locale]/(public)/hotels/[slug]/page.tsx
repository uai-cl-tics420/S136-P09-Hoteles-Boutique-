import { notFound } from "next/navigation";
import { getHotelBySlug } from "@/services/hotel.service";
import { getReviewsByHotel } from "@/services/review.service";
import BookingWidget from "@/components/BookingWidget";

// Server Component — datos del hotel cargados en el servidor
export const dynamic = "force-dynamic";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function HotelDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;

  // Cargar hotel primero para obtener el id, luego reviews en paralelo
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const reviews = await getReviewsByHotel(hotel.id);

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.ratingOverall, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Header Glassmórfico */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href={`/${locale}/hotels`} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2">
            <span>←</span> Volver a Hoteles
          </a>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{hotel.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-10">
            {/* Header del Hotel */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold tracking-wide uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{CAT_LABELS[hotel.category]}</span>
                <span className="text-sm tracking-widest text-amber-500">{"★".repeat(hotel.starRating)}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">{hotel.name}</h1>
              <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                <p className="flex items-center gap-1.5"><span className="text-lg">📍</span> {hotel.locationCity}, {hotel.locationCountry}</p>
                {avgRating && <p className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">★ {avgRating}</span> ({reviews.length} reseñas)</p>}
              </div>
            </div>

            {/* Galería Principal Inmersiva */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-4 h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-sm group">
                {hotel.images?.[0] && (
                  <img
                    src={hotel.images[0].url}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                  />
                )}
              </div>
            </div>

            {/* Galería secundaria y Descripción */}
            {hotel.description && (
              <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed font-light">
                <p>{hotel.description.replace(/\[GUEST_CONFIG\][\s\S]*?\[\/GUEST_CONFIG\]/g, "").trim()}</p>
              </div>
            )}

            {hotel.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {hotel.images.slice(1).map((img: any) => (
                  <div key={img.id} className="min-w-[200px] h-32 md:min-w-[280px] md:h-48 rounded-2xl overflow-hidden snap-center flex-shrink-0">
                    <img src={img.url} alt={hotel.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {hotel.roomTypes?.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Habitaciones disponibles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotel.roomTypes.map((rt: any) => (
                    <div key={rt.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mb-4">
                        <p className="text-lg font-bold text-gray-900">{rt.name}</p>
                        <p className="text-sm text-gray-400 mt-1">Hasta {rt.capacity} personas</p>
                      </div>
                      {rt.description && <p className="text-sm text-gray-500 mb-4 font-light">{rt.description}</p>}
                      
                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                        {rt.amenities?.length > 0 ? (
                          <div className="flex gap-2">
                            <span className="text-lg" title={rt.amenities.join(", ")}>✨</span>
                          </div>
                        ) : <div />}
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">${parseFloat(rt.pricePerNight).toLocaleString()}</p>
                          <p className="text-xs text-gray-400 font-medium">por noche</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ubicación */}
            {hotel.address && (
              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ubicación</h2>
                <div className="bg-gray-100 rounded-3xl p-6 md:p-8 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">📍</div>
                  <div>
                    <p className="text-gray-900 font-medium">{hotel.address}</p>
                    <p className="text-sm text-gray-500">{hotel.locationCity}, {hotel.locationCountry}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reseñas */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-end justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Reseñas de huéspedes</h2>
                {avgRating && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-amber-400 text-2xl">★</span> {avgRating}
                    </p>
                    <p className="text-sm text-gray-400 font-medium">De {reviews.length} reseñas verificadas</p>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                  <p className="text-gray-400">Este hotel aún no tiene reseñas. ¡Sé el primero!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                          {r.guestId?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Huésped verificado</p>
                          <p className="text-xs text-gray-400 font-medium">
                            {new Date(r.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <div className="ml-auto flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= r.ratingOverall ? "text-amber-400" : "text-gray-200"}`}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">"{r.comment}"</p>}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Servicio",  val: r.ratingService },
                          { label: "Limpieza",  val: r.ratingCleanliness },
                          { label: "Ubicación", val: r.ratingLocation },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{label}</p>
                            <p className="text-sm font-bold text-gray-900">{val}<span className="text-xs text-gray-400 font-normal">/5</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Widget de reserva — Client Component */}
          <div className="lg:col-span-1">
            <BookingWidget
              hotelSlug={hotel.slug}
              roomTypes={(hotel.roomTypes ?? []) as any[]}
              extraServices={(hotel.extraServices ?? []) as any[]}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
