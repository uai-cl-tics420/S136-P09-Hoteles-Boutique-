"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import type { Hotel } from "@/types/domain";

export default function HotelDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = use(params);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetch(`/api/hotels?slug=${slug}`)
      .then(r => r.json())
      .then(d => { setHotel(d.hotels?.[0] ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  async function handleBook() {
    if (!selectedRoom || !checkIn || !checkOut) { toast.error("Completa todos los campos"); return; }
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomTypeId: selectedRoom, checkIn, checkOut, guestsCount: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error al reservar"); return; }
      toast.success("¡Reserva confirmada!");
      window.location.href = "/es/bookings";
    } catch { toast.error("Error de conexión"); }
    finally { setBooking(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Cargando hotel...</div>
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><p className="text-gray-500 mb-4">Hotel no encontrado</p>
        <a href="/es/hotels" className="text-gray-900 font-medium hover:underline">← Volver</a></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/es/hotels" className="text-sm text-gray-500 hover:text-gray-900">← Hoteles</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">{hotel.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: hotel info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                {hotel.images?.[0] && (
                  <img src={hotel.images[0].url} alt={hotel.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{hotel.name}</h1>
                  <span className="text-sm text-gray-400">{"★".repeat(hotel.starRating)}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{hotel.locationCity}, {hotel.locationCountry}</p>
                {hotel.description && <p className="text-gray-600 text-sm leading-relaxed">{hotel.description}</p>}
              </div>
            </div>

            {/* Room types */}
            {hotel.roomTypes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Habitaciones disponibles</h2>
                <div className="space-y-3">
                  {hotel.roomTypes.map((rt: any) => (
                    <div key={rt.id} onClick={() => setSelectedRoom(rt.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedRoom === rt.id ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{rt.name}</p>
                          <p className="text-xs text-gray-500">Capacidad: {rt.capacity} personas</p>
                        </div>
                        <p className="font-semibold text-gray-900">${parseFloat(rt.pricePerNight).toLocaleString()} <span className="text-xs font-normal text-gray-400">/noche</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra services */}
            {hotel.extraServices?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Servicios adicionales</h2>
                <div className="grid grid-cols-2 gap-3">
                  {hotel.extraServices.map((s: any) => (
                    <div key={s.id} className="p-3 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">${parseFloat(s.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: booking widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Reservar</h2>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                {hotel.roomTypes?.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Habitación</label>
                    <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                      <option value="">Selecciona una habitación</option>
                      {hotel.roomTypes.map((rt: any) => (
                        <option key={rt.id} value={rt.id}>{rt.name} — ${parseFloat(rt.pricePerNight).toLocaleString()}/noche</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button onClick={handleBook} disabled={booking || !selectedRoom || !checkIn || !checkOut}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                {booking ? "Procesando..." : "Confirmar reserva"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">Sin cargos adicionales hasta confirmar</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}