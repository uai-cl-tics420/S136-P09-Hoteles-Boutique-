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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href={`/${locale}/hotels`} className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium text-gray-900">{hotel.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                {hotel.images?.[0] && (
                  <img
                    src={hotel.images[0].url}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-1">
                  <h1 className="text-2xl font-semibold text-gray-900">{hotel.name}</h1>
                  <span className="text-sm text-gray-300">{"★".repeat(hotel.starRating)}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-sm text-gray-400">{hotel.locationCity}, {hotel.locationCountry}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{CAT_LABELS[hotel.category]}</span>
                  {avgRating && <span className="text-xs text-amber-500 font-medium">{avgRating} ★ ({reviews.length} reseñas)</span>}
                </div>
                {hotel.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {hotel.description.replace(/\[GUEST_CONFIG\][\s\S]*?\[\/GUEST_CONFIG\]/g, "").trim()}
                  </p>
                )}
              </div>
            </div>

            {/* Galería de imágenes adicionales */}
            {hotel.images?.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {hotel.images.slice(1, 4).map((img: any) => (
                  <div key={img.id} className="h-24 bg-gray-100 rounded-xl overflow-hidden">
                    <img src={img.url} alt={hotel.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Tipos de habitación */}
            {hotel.roomTypes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Tipos de habitación</h2>
                <div className="space-y-3">
                  {hotel.roomTypes.map((rt: any) => (
                    <div key={rt.id} className="p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{rt.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Capacidad: {rt.capacity} personas</p>
                          {rt.description && <p className="text-xs text-gray-500 mt-1">{rt.description}</p>}
                          {rt.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rt.amenities.slice(0, 4).map((a: string) => (
                                <span key={a} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${parseFloat(rt.pricePerNight).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">por noche</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reseñas */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Reseñas de huéspedes ({reviews.length})</h2>
                {avgRating && (
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-gray-900">{avgRating}</p>
                    <p className="text-xs text-gray-400">{reviews.length} reseñas</p>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400">Sé el primero en dejar una reseña</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            {r.guestId?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Huésped verificado</p>
                            <p className="text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <span className="text-amber-400 text-sm">{"★".repeat(r.ratingOverall)}</span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 leading-relaxed mb-2">{r.comment}</p>}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Atención",  val: r.ratingService },
                          { label: "Limpieza",  val: r.ratingCleanliness },
                          { label: "Ubicación", val: r.ratingLocation },
                        ].map(({ label, val }) => (
                          <div key={label} className="text-center bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className="text-sm font-medium text-gray-900">{val}/5</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ubicación */}
            {hotel.address && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">Ubicación</h2>
                <p className="text-sm text-gray-500">{hotel.address}</p>
                <p className="text-sm text-gray-500">{hotel.locationCity}, {hotel.locationCountry}</p>
              </div>
            )}
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
