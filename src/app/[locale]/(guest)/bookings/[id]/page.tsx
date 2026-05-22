"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, { badge: string; bg: string; text: string; icon: string }> = {
  PENDING:   { badge: "bg-amber-50 text-amber-700 border-amber-200", bg: "from-amber-50 to-orange-50", text: "text-amber-700", icon: "⏳" },
  CONFIRMED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bg: "from-emerald-50 to-teal-50", text: "text-emerald-700", icon: "✅" },
  CANCELLED: { badge: "bg-red-50 text-red-600 border-red-200", bg: "from-red-50 to-rose-50", text: "text-red-600", icon: "✗" },
  COMPLETED: { badge: "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]", bg: "from-gray-50 to-slate-50", text: "text-[var(--text-muted)]", icon: "🏁" },
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente de Confirmación", CONFIRMED: "Reserva Confirmada",
  CANCELLED: "Reserva Cancelada", COMPLETED: "Estancia Completada",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function getNights(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${id}`).then(r => r.json())
      .then(d => { setBooking(d.booking); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleCancel() {
    if (!confirm("¿Deseas cancelar esta reserva? Esta acción no se puede deshacer.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Reserva cancelada exitosamente");
        setBooking((b: any) => ({ ...b, status: "CANCELLED" }));
      } else {
        toast.error("No se pudo cancelar la reserva");
      }
    } catch { toast.error("Error de conexión"); }
    finally { setCancelling(false); }
  }

  if (loading) return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="space-y-4 w-full max-w-2xl px-5">
        <div className="h-64 bg-white rounded-3xl border border-[var(--border)] animate-shimmer" />
        <div className="h-32 bg-white rounded-3xl border border-[var(--border)] animate-shimmer" />
      </div>
    </main>
  );

  if (!booking) return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center py-20 bg-white rounded-3xl border border-[var(--border)] px-12 shadow-[var(--shadow-xs)]">
        <span className="text-4xl block mb-4 opacity-50">🔍</span>
        <p className="text-lg font-black text-[var(--text-primary)] mb-2">Reserva no encontrada</p>
        <p className="text-sm text-[var(--text-muted)] mb-6">El identificador de esta reserva no es válido o no tienes acceso.</p>
        <a href="/es/bookings"
          className="inline-block bg-[var(--text-primary)] text-white rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-md">
          ← Mis Reservas
        </a>
      </div>
    </main>
  );

  const status = booking.status as string;
  const style = STATUS_COLOR[status] ?? STATUS_COLOR.PENDING;
  const nights = getNights(booking.checkIn, booking.checkOut);
  const hotelImage = booking.roomType?.hotel?.images?.[0]?.url;
  const extrasTotal = (booking.extras ?? []).reduce((acc: number, e: any) =>
    acc + parseFloat(e.extraService?.price ?? "0") * (e.quantity ?? 1), 0);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/es/bookings" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              ← Mis Reservas
            </a>
            <span className="text-[var(--border)]">|</span>
            <span className="text-sm font-bold uppercase tracking-wide text-[var(--text-primary)]">Detalle de Reserva</span>
          </div>
          <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border ${style.badge}`}>
            {style.icon} {STATUS_LABEL[status] ?? status}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-6 animate-slide-up">

        {/* Hero: Hotel image + name */}
        <div className="bg-white rounded-3xl border border-[var(--border)] overflow-hidden shadow-[var(--shadow-xs)]">
          {hotelImage && (
            <div className="relative h-56 w-full">
              <img src={hotelImage} alt={booking.roomType?.hotel?.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1">
                  {booking.roomType?.hotel?.category}
                  {booking.roomType?.hotel?.starRating && (
                    <span className="ml-2">{"★".repeat(booking.roomType.hotel.starRating)}</span>
                  )}
                </p>
                <h1 className="text-2xl font-black text-white">{booking.roomType?.hotel?.name}</h1>
                <p className="text-sm text-white/70 mt-0.5">{booking.roomType?.name}</p>
              </div>
            </div>
          )}

          <div className={`${!hotelImage ? "pt-8" : ""} p-7`}>
            {!hotelImage && (
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1">
                  {booking.roomType?.hotel?.category}
                </p>
                <h1 className="text-2xl font-black text-[var(--text-primary)]">{booking.roomType?.hotel?.name}</h1>
                <p className="text-base font-medium text-[var(--gold)]">{booking.roomType?.name}</p>
              </div>
            )}

            {/* Stay details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Check-in", value: formatDate(booking.checkIn), icon: "📅" },
                { label: "Check-out", value: formatDate(booking.checkOut), icon: "📅" },
                { label: "Duración", value: `${nights} ${nights === 1 ? "noche" : "noches"}`, icon: "🌙" },
                { label: "Huéspedes", value: `${booking.guestsCount} ${booking.guestsCount === 1 ? "persona" : "personas"}`, icon: "👥" },
                { label: "Divisa", value: booking.currency ?? "USD", icon: "💱" },
                { label: "Referencia", value: `#${booking.id.slice(0, 8).toUpperCase()}`, icon: "🔖" },
              ].map(item => (
                <div key={item.label} className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{item.label}</p>
                  <p className="text-sm font-black text-[var(--text-primary)]">
                    <span className="mr-1.5">{item.icon}</span>{item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Special requests */}
            {booking.specialRequests && (
              <div className="mt-5 p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border-soft)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Solicitudes Especiales</p>
                <p className="text-sm font-medium text-[var(--text-primary)] italic leading-relaxed">"{booking.specialRequests}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Extras */}
        {booking.extras?.length > 0 && (
          <div className="bg-white rounded-3xl border border-[var(--border)] p-7 shadow-[var(--shadow-xs)]">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-5">Servicios Exclusivos Incluidos</h2>
            <div className="space-y-3">
              {booking.extras.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{e.extraService?.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
                      {e.extraService?.category} · ×{e.quantity ?? 1}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[var(--text-primary)]">
                    ${(parseFloat(e.extraService?.price ?? "0") * (e.quantity ?? 1)).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="bg-white rounded-3xl border border-[var(--border)] p-7 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-5">Resumen de Costos</h2>
          <div className="space-y-3">
            {extrasTotal > 0 && (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-[var(--text-muted)]">Alojamiento ({nights} noches)</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    ${(parseFloat(booking.totalPrice) - extrasTotal).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-[var(--text-muted)]">Servicios exclusivos</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">${extrasTotal.toLocaleString()}</span>
                </div>
                <div className="border-t border-[var(--border-soft)]" />
              </>
            )}
            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total a Pagar</p>
                <p className="text-3xl font-black text-[var(--text-primary)] mt-1">
                  ${parseFloat(booking.totalPrice).toLocaleString()}
                  <span className="text-base font-medium text-[var(--text-muted)] ml-2">{booking.currency ?? "USD"}</span>
                </p>
              </div>
              {status === "CONFIRMED" && (
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">✓ Confirmado</p>
                  <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1">Tu reserva está asegurada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/es/bookings"
            className="flex-1 text-center bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-full py-4 text-sm font-bold uppercase tracking-widest hover:bg-[var(--surface-hover)] transition-all">
            ← Mis Reservas
          </a>

          {status === "COMPLETED" && (
            <a href={`/es/hotels/${booking.roomType?.hotel?.slug}`}
              className="flex-1 text-center bg-[var(--gold)] text-white rounded-full py-4 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600 transition-all shadow-md">
              ⭐ Calificar Estancia
            </a>
          )}

          {status === "CONFIRMED" && (
            <button onClick={handleCancel} disabled={cancelling}
              className="flex-1 text-center border border-red-200 text-red-500 rounded-full py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50">
              {cancelling ? "Cancelando..." : "Cancelar Reserva"}
            </button>
          )}

          {(status === "CONFIRMED" || status === "PENDING") && (
            <a href={`/es/hotels/${booking.roomType?.hotel?.slug}`}
              className="flex-1 text-center bg-[var(--text-primary)] text-white rounded-full py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md">
              Ver Hotel →
            </a>
          )}
        </div>
      </div>
    </main>
  );
}