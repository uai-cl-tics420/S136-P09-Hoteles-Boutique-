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
        {roomTypes.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Habitación</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Selecciona una habitación</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} — ${parseFloat(rt.pricePerNight).toLocaleString()}/noche</option>
              ))}
            </select>
          </div>
        )}
        {/* Extras disponibles */}
        {extraServices.filter((s) => s.available).length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Servicios adicionales</label>
            <div className="space-y-1">
              {extraServices.filter((s) => s.available).map((s) => {
                const checked = selectedExtras.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleExtra(s.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm ${checked ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
                  >
                    <span>{EXTRA_ICONS[s.category] ?? "✨"}</span>
                    <span className="flex-1 text-gray-700">{s.name}</span>
                    <span className="text-xs font-semibold text-gray-600">+${parseFloat(s.price).toLocaleString()}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${checked ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
                      {checked && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
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

      <button
        onClick={handleBook}
        disabled={booking || !selectedRoom || !checkIn || !checkOut || nights <= 0}
        className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {booking ? "Procesando..." : "Confirmar reserva"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">Sin cargos adicionales hasta confirmar</p>
    </div>
  );
}
