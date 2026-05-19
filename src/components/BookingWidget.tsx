"use client";
import { useState } from "react";
import { toast } from "sonner";

interface RoomType {
  id: string;
  name: string;
  pricePerNight: string;
  capacity: number;
  description?: string | null;
  amenities?: string[];
}

interface ExtraService {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  category: string;
  available: boolean;
}

const EXTRA_ICONS: Record<string, string> = {
  SPA: "💆", DINING: "🕯️", TRANSPORT: "🚗", EXPERIENCE: "🗺️", OTHER: "🎁",
};

interface Props {
  hotelSlug: string;
  roomTypes: RoomType[];
  extraServices: ExtraService[];
  locale: string;
}

export default function BookingWidget({ hotelSlug, roomTypes, extraServices, locale }: Props) {
  const [checkIn, setCheckIn]           = useState("");
  const [checkOut, setCheckOut]         = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [specialRequests, setSpecialRequests] = useState("");
  const [guestsCount, setGuestsCount]   = useState(1);
  const [booking, setBooking]           = useState(false);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const selectedRoomObj = roomTypes.find((r) => r.id === selectedRoom);
  const roomTotal    = selectedRoomObj ? parseFloat(selectedRoomObj.pricePerNight) * nights : 0;
  const extrasTotal  = [...selectedExtras].reduce((acc, id) => {
    const extra = extraServices.find((e) => e.id === id);
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
      window.location.href = `/${locale}/bookings`;
    } catch { toast.error("Error de conexión"); }
    finally { setBooking(false); }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">🛎️</span>
        <h2 className="text-xl font-bold text-gray-900">Reservar estadía</h2>
      </div>

      <div className="space-y-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-gray-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split("T")[0]}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Huéspedes</label>
          <input
            type="number"
            min={1}
            max={10}
            value={guestsCount}
            onChange={(e) => setGuestsCount(parseInt(e.target.value))}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-gray-700"
          />
        </div>

        {roomTypes.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Habitación</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-gray-700 cursor-pointer appearance-none"
            >
              <option value="">Selecciona una habitación</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} — ${parseFloat(rt.pricePerNight).toLocaleString()} /noche</option>
              ))}
            </select>
          </div>
        )}

        {/* Extras disponibles */}
        {extraServices.filter((s) => s.available).length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Servicios Extra</label>
            <div className="space-y-2">
              {extraServices.filter((s) => s.available).map((s) => {
                const checked = selectedExtras.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleExtra(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${checked ? "border-gray-900 bg-gray-900/5 shadow-inner" : "border-gray-100 bg-white hover:border-gray-300"}`}
                  >
                    <span className="text-xl">{EXTRA_ICONS[s.category] ?? "✨"}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{s.name}</span>
                    <span className="text-xs font-bold text-gray-900">+${parseFloat(s.price).toLocaleString()}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${checked ? "bg-gray-900 border-gray-900" : "border-gray-200"}`}>
                      {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Peticiones especiales (Opcional)</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
            placeholder="Alergias, celebraciones, horarios..."
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all resize-none text-gray-700"
          />
        </div>
      </div>

      {nights > 0 && selectedRoom && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-500">
            <span>{selectedRoomObj?.name} × {nights} noche{nights !== 1 ? "s" : ""}</span>
            <span className="text-gray-900">${roomTotal.toLocaleString()}</span>
          </div>
          {extrasTotal > 0 && (
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Servicios extra ({selectedExtras.size})</span>
              <span className="text-gray-900">+${extrasTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total a pagar</span>
            <span className="text-2xl font-black text-gray-900">${grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={booking || !selectedRoom || !checkIn || !checkOut || nights <= 0}
        className="w-full bg-gray-900 text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-gray-800 transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      >
        {booking ? "Procesando..." : "Confirmar reserva"}
      </button>
      <p className="text-[11px] font-medium text-gray-400 text-center mt-4">
        No se te cobrará ningún cargo por ahora.
      </p>
    </div>
  );
}
