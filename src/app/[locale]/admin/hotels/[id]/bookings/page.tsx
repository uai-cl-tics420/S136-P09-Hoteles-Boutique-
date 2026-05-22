"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-500 border-red-200",
  COMPLETED: "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]",
};
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada", PENDING: "Pendiente",
  CANCELLED: "Cancelada", COMPLETED: "Completada",
};

export default function AdminHotelBookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("all");
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bookings").then(r => r.json())
      .then(d => {
        const all = d.bookings ?? [];
        const filtered = all.filter((b: any) =>
          b.roomType?.hotel?.id === id || b.roomType?.hotelId === id
        );
        setBookings(filtered);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [id]);

  async function updateStatus(bookingId: string, newStatus: string) {
    setChangingStatus(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        toast.success(`Estado actualizado: ${STATUS_LABEL[newStatus]}`);
      } else {
        toast.error("No se pudo actualizar el estado");
      }
    } catch { toast.error("Error de conexión"); }
    finally { setChangingStatus(null); }
  }

  const displayed = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const pending = bookings.filter(b => b.status === "PENDING").length;
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const revenue = bookings
    .filter(b => ["CONFIRMED", "COMPLETED"].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.totalPrice ?? "0"), 0);

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 bg-[var(--surface)] p-2 rounded-full border border-[var(--border)] w-max">
        <a href={`/es/admin/hotels/${id}`}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--surface-hover)]">
          ← Propiedad
        </a>
        <span className="text-[var(--border)]">|</span>
        <span className="px-4 text-sm font-black text-[var(--text-primary)]">Libro de Reservas</span>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pendientes", value: pending, icon: "⏳", color: "text-amber-600" },
            { label: "Confirmadas", value: confirmed, icon: "✅", color: "text-emerald-600" },
            { label: "Ingresos Totales", value: `$${revenue.toLocaleString()}`, icon: "💰", color: "text-[var(--text-primary)]" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-3xl border border-[var(--border)] p-5 shadow-[var(--shadow-xs)] flex items-center gap-4">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-max shadow-[var(--shadow-xs)]">
        {(["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
              filter === f ? "bg-[var(--text-primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}>
            {{ all: "Todas", PENDING: "Pendientes", CONFIRMED: "Confirmadas", COMPLETED: "Completadas", CANCELLED: "Canceladas" }[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Reservas del Hotel</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--surface)] text-[var(--text-muted)] px-3 py-1 rounded-full border border-[var(--border)]">
            {displayed.length} registros
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[var(--surface)] rounded-2xl animate-shimmer" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <span className="text-4xl block mb-4 opacity-50">📋</span>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {filter === "all" ? "No hay reservas para este hotel" : `No hay reservas ${STATUS_LABEL[filter]?.toLowerCase()}s`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-[var(--border-soft)]">
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Habitación & Detalle</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Fechas</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Importe</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Estado</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {displayed.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[var(--surface-hover)] transition-colors group">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors">
                        {b.roomType?.name}
                      </p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                        {b.guestsCount} {b.guestsCount === 1 ? "huésped" : "huéspedes"}
                        {b.specialRequests && <span className="ml-2 text-[var(--gold)]">· Solicitud especial</span>}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-[var(--text-primary)]">{b.checkIn}</p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)]">al {b.checkOut}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm font-black text-[var(--text-primary)]">
                        ${parseFloat(b.totalPrice ?? "0").toLocaleString()}
                      </p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)]">{b.currency ?? "USD"}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${STATUS_COLOR[b.status] ?? "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]"}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {b.status === "PENDING" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            disabled={changingStatus === b.id}
                            onClick={() => updateStatus(b.id, "CONFIRMED")}
                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            disabled={changingStatus === b.id}
                            onClick={() => updateStatus(b.id, "CANCELLED")}
                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {b.status === "CONFIRMED" && (
                        <button
                          disabled={changingStatus === b.id}
                          onClick={() => updateStatus(b.id, "COMPLETED")}
                          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] rounded-lg hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                        >
                          Marcar Completada
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}