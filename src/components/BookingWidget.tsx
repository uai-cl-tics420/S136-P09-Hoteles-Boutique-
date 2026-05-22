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

const EXTRA_CAT_LABELS: Record<string, string> = {
  SPA: "Spa & Bienestar", DINING: "Gastronomía", TRANSPORT: "Transporte",
  EXPERIENCE: "Experiencia", OTHER: "Especial",
};

interface Props {
  hotelSlug: string;
  roomTypes: RoomType[];
  extraServices: ExtraService[];
  locale: string;
  isLoggedIn?: boolean;
}

export default function BookingWidget({
  hotelSlug, roomTypes, extraServices, locale, isLoggedIn = false,
}: Props) {
  const [checkIn, setCheckIn]               = useState("");
  const [checkOut, setCheckOut]             = useState("");
  const [selectedRoom, setSelectedRoom]     = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [specialRequests, setSpecialRequests] = useState("");
  const [guestsCount, setGuestsCount]       = useState(1);
  const [booking, setBooking]               = useState(false);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const selectedRoomObj = roomTypes.find((r) => r.id === selectedRoom);
  const roomTotal   = selectedRoomObj ? parseFloat(selectedRoomObj.pricePerNight) * nights : 0;
  const extrasTotal = [...selectedExtras].reduce((acc, id) => {
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

  const today = new Date().toISOString().split("T")[0];

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

      if (res.status === 401) {
        toast.error("Debes iniciar sesión para reservar", {
          description: "Te redirigiremos al inicio de sesión...",
          duration: 3000,
        });
        setTimeout(() => { window.location.href = `/${locale}/auth/login`; }, 1800);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al procesar la reserva");
        return;
      }

      toast.success("¡Reserva confirmada! 🎉", {
        description: "Puedes ver todos los detalles a continuación.",
      });

      // Redirect to booking detail page
      setTimeout(() => {
        const bookingId = data.booking?.id;
        window.location.href = bookingId
          ? `/${locale}/bookings/${bookingId}`
          : `/${locale}/bookings`;
      }, 1500);
    } catch {
      toast.error("Error de conexión. Por favor intenta nuevamente.");
    } finally {
      setBooking(false);
    }
  }

  const availableExtras = extraServices.filter((s) => s.available);
  const isReady = selectedRoom && checkIn && checkOut && nights > 0;

  return (
    <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-md)] sticky top-24 overflow-hidden">

      {/* Header */}
      <div className="bg-[var(--text-primary)] px-7 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1">Reserva Exclusiva</p>
        <h2 className="text-xl font-black text-white">Asegurar mi estadía</h2>
        {selectedRoomObj && nights > 0 && (
          <p className="text-white/60 text-xs font-medium mt-1">
            {selectedRoomObj.name} · {nights} {nights === 1 ? "noche" : "noches"}
          </p>
        )}
      </div>

      <div className="p-7 space-y-5">

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }}
              min={today}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)] transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || today}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)] transition-all"
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
            Huéspedes
          </label>
          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5">
            <button
              type="button"
              onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
              className="w-7 h-7 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-bold hover:border-[var(--gold)] transition-colors text-sm"
            >−</button>
            <span className="flex-1 text-center text-sm font-bold text-[var(--text-primary)]">
              {guestsCount} {guestsCount === 1 ? "persona" : "personas"}
            </span>
            <button
              type="button"
              onClick={() => setGuestsCount(Math.min(selectedRoomObj?.capacity ?? 10, guestsCount + 1))}
              className="w-7 h-7 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-bold hover:border-[var(--gold)] transition-colors text-sm"
            >+</button>
          </div>
          {selectedRoomObj && (
            <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1">
              Capacidad máx: {selectedRoomObj.capacity} personas
            </p>
          )}
        </div>

        {/* Room type */}
        {roomTypes.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Tipo de Habitación
            </label>
            <div className="space-y-2">
              {roomTypes.map((rt) => {
                const isSelected = selectedRoom === rt.id;
                return (
                  <div
                    key={rt.id}
                    onClick={() => setSelectedRoom(rt.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-[var(--gold)] bg-[var(--gold)]/5 shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-primary)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--border)]"
                      }`}>
                        {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{rt.name}</p>
                        <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5">
                          Hasta {rt.capacity} personas
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-black text-[var(--text-primary)]">
                        ${parseFloat(rt.pricePerNight).toLocaleString()}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">/ noche</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extras */}
        {availableExtras.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Servicios Exclusivos
            </label>
            <div className="space-y-2">
              {availableExtras.map((s) => {
                const checked = selectedExtras.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleExtra(s.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      checked
                        ? "border-[var(--text-primary)] bg-[var(--surface-hover)] shadow-inner"
                        : "border-[var(--border)] bg-white hover:border-[var(--text-primary)]/30"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{EXTRA_ICONS[s.category] ?? "✨"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{s.name}</p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)]">{EXTRA_CAT_LABELS[s.category]}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-[var(--text-primary)]">+${parseFloat(s.price).toLocaleString()}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      checked ? "bg-[var(--text-primary)] border-[var(--text-primary)]" : "border-[var(--border)]"
                    }`}>
                      {checked && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Special requests */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
            Solicitudes Especiales <span className="normal-case font-normal">(Opcional)</span>
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
            placeholder="Alergias, celebraciones, horarios de llegada..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)] transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Price summary */}
        {nights > 0 && selectedRoom && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[var(--text-muted)]">
                {selectedRoomObj?.name} × {nights} {nights === 1 ? "noche" : "noches"}
              </span>
              <span className="font-bold text-[var(--text-primary)]">${roomTotal.toLocaleString()}</span>
            </div>
            {extrasTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[var(--text-muted)]">
                  Servicios exclusivos ({selectedExtras.size})
                </span>
                <span className="font-bold text-[var(--text-primary)]">+${extrasTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-[var(--border-soft)]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Total a pagar
              </span>
              <span className="text-2xl font-black text-[var(--text-primary)]">
                ${grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Login prompt */}
        {!isLoggedIn && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
            <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-800">Necesitas una cuenta para reservar</p>
              <a
                href={`/${locale}/auth/login`}
                className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 font-semibold mt-0.5 inline-block"
              >
                Iniciar sesión o registrarse gratis →
              </a>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleBook}
          disabled={booking || !isReady}
          className={`w-full rounded-2xl py-4 text-sm font-bold tracking-wide transition-all shadow-md ${
            isReady && !booking
              ? "bg-[var(--gold)] text-white hover:bg-yellow-600 hover:shadow-[var(--shadow-gold)] hover:-translate-y-0.5 active:translate-y-0"
              : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed"
          } disabled:opacity-60`}
        >
          {booking
            ? "Procesando reserva..."
            : !isReady
              ? "Completa los campos para reservar"
              : isLoggedIn
                ? "✓ Confirmar Reserva"
                : "Iniciar sesión para reservar"}
        </button>

        <p className="text-[11px] font-medium text-[var(--text-muted)] text-center">
          Sin cargos adicionales · Confirmación inmediata
        </p>
      </div>
    </div>
  );
}
