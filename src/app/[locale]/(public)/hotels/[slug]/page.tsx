"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

const EXTRA_ICONS: Record<string, string> = {
  SPA: "💆", DINING: "🕯️", TRANSPORT: "🚗", EXPERIENCE: "🗺️", OTHER: "🎁",
};

export default function HotelDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = use(params);
  const [hotel, setHotel] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [specialRequests, setSpecialRequests] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [booking, setBooking] = useState(false);
  const [tab, setTab] = useState<"info" | "rooms" | "extras" | "reviews">("info");

  useEffect(() => {
    fetch(`/api/hotels?slug=${slug}`)
      .then((r) => r.json())
      .then(async (d) => {
        const h = d.hotels?.[0] ?? null;
        setHotel(h);
        if (h) {
          const rv = await fetch(`/api/reviews?hotelId=${h.id}`).then((r) => r.json());
          setReviews(rv.reviews ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const selectedRoomObj = hotel?.roomTypes?.find((r: any) => r.id === selectedRoom);
  const roomTotal = selectedRoomObj ? parseFloat(selectedRoomObj.pricePerNight) * nights : 0;
  const extrasTotal = [...selectedExtras].reduce((acc, id) => {
    const extra = hotel?.extraServices?.find((e: any) => e.id === id);
    return acc + (extra ? parseFloat(extra.price) : 0);
  }, 0);
  const grandTotal = roomTotal + extrasTotal;

  function toggleExtra(id: string) {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBook() {
    if (!selectedRoom || !checkIn || !checkOut || nights <= 0) {
      toast.error("Completa todos los campos de la reserva");
      return;
    }
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: selectedRoom,
          checkIn,
          checkOut,
          guestsCount,
          specialRequests: specialRequests || undefined,
          extras: [...selectedExtras].map((id) => ({ extraServiceId: id, quantity: 1 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error al reservar"); return; }
      toast.success("¡Reserva confirmada!");
      window.location.href = "/es/bookings";
    } catch { toast.error("Error de conexión"); }
    finally { setBooking(false); }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.ratingOverall, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Cargando hotel...</div>
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Hotel no encontrado</p>
        <a href="/es/hotels" className="text-gray-900 font-medium hover:underline">← Volver</a>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/es/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium text-gray-900">{hotel.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                {hotel.images?.[0] && (
                  <img src={hotel.images[0].url} alt={hotel.name} className="w-full h-full object-cover" />
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

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(["info", "rooms", "extras", "reviews"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {{ info: "Información", rooms: "Habitaciones", extras: "Extras", reviews: `Reseñas (${reviews.length})` }[t]}
                </button>
              ))}
            </div>

            {/* Tab: rooms */}
            {tab === "rooms" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Tipos de habitación</h2>
                {!hotel.roomTypes?.length ? (
                  <p className="text-sm text-gray-400">No hay habitaciones configuradas</p>
                ) : (
                  <div className="space-y-3">
                    {hotel.roomTypes.map((rt: any) => (
                      <div
                        key={rt.id}
                        onClick={() => setSelectedRoom(rt.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRoom === rt.id ? "border-gray-900 bg-gray-50 shadow-sm" : "border-gray-100 hover:border-gray-300"}`}
                      >
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
                            {selectedRoom === rt.id && <p className="text-xs text-green-600 font-medium mt-1">✓ Seleccionada</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: extras */}
            {tab === "extras" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-1">Experiencias adicionales</h2>
                <p className="text-xs text-gray-400 mb-4">Personaliza tu estadía con servicios exclusivos</p>
                {!hotel.extraServices?.length ? (
                  <p className="text-sm text-gray-400">No hay servicios adicionales disponibles</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hotel.extraServices.filter((s: any) => s.available).map((s: any) => {
                      const checked = selectedExtras.has(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleExtra(s.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${checked ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{EXTRA_ICONS[s.category] ?? "✨"}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{s.name}</p>
                              {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                              <p className="text-xs font-semibold text-gray-700 mt-1">+${parseFloat(s.price).toLocaleString()}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
                              {checked && <span className="text-white text-xs">✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: reviews */}
            {tab === "reviews" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Reseñas de huéspedes</h2>
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
                              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}</p>
                            </div>
                          </div>
                          <span className="text-amber-400 text-sm">{"★".repeat(r.ratingOverall)}</span>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 leading-relaxed mb-2">{r.comment}</p>}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Atención", val: r.ratingService },
                            { label: "Limpieza", val: r.ratingCleanliness },
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
            )}

            {/* Tab: info */}
            {tab === "info" && hotel.address && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">Ubicación</h2>
                <p className="text-sm text-gray-500">{hotel.address}</p>
                <p className="text-sm text-gray-500">{hotel.locationCity}, {hotel.locationCountry}</p>
              </div>
            )}
          </div>

          {/* Right: booking widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Reservar</h2>
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Huéspedes</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                {hotel.roomTypes?.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Habitación</label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Selecciona una habitación</option>
                      {hotel.roomTypes.map((rt: any) => (
                        <option key={rt.id} value={rt.id}>{rt.name} — ${parseFloat(rt.pricePerNight).toLocaleString()}/noche</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Solicitudes especiales</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={2}
                    placeholder="Alergias, preferencias, celebraciones..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Price breakdown */}
              {nights > 0 && selectedRoom && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{selectedRoomObj?.name} × {nights} noche{nights !== 1 ? "s" : ""}</span>
                    <span>${roomTotal.toLocaleString()}</span>
                  </div>
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Extras ({selectedExtras.size})</span>
                      <span>+${extrasTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total</span>
                    <span>${grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {selectedExtras.size > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Extras seleccionados:</p>
                  <div className="flex flex-wrap gap-1">
                    {[...selectedExtras].map((id) => {
                      const s = hotel.extraServices?.find((e: any) => e.id === id);
                      return s ? (
                        <span key={id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                          {s.name}
                          <button onClick={() => toggleExtra(id)} className="text-gray-400 hover:text-gray-700">×</button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={booking || !selectedRoom || !checkIn || !checkOut || nights <= 0}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {booking ? "Procesando..." : "Confirmar reserva"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">Sin cargos adicionales hasta confirmar</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setTab("extras")}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 text-center"
                >
                  + Agregar experiencias adicionales
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}