"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/bookings").then((r) => r.json()),
      fetch("/api/hotels").then((r) => r.json()),
    ]).then(([b, h]) => {
      setBookings(b.bookings ?? []);
      setHotels(h.hotels ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function updateBookingStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Reserva marcada como ${statusLabel[status] ?? status}`);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    } else {
      toast.error("No se pudo actualizar el estado");
    }
  }

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const totalRevenue = bookings
    .filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.totalPrice ?? "0"), 0);

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-red-50 text-red-500 border-red-200",
    COMPLETED: "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]",
  };
  const statusLabel: Record<string, string> = {
    CONFIRMED: "Confirmada", PENDING: "Pendiente", CANCELLED: "Cancelada", COMPLETED: "Completada",
  };

  return (
    <div className="space-y-12 max-w-6xl">
      <div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Centro de Control</h1>
        <p className="text-sm font-medium text-[var(--text-muted)] mt-2">Visión global del rendimiento de tu colección de propiedades.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 stagger-children">
        {[
          { label: "Propiedades Activas", value: hotels.length, icon: "🏨" },
          { label: "Reservas Confirmadas", value: confirmed, icon: "✅" },
          { label: "Pendientes por Revisar", value: pending, icon: "⏳" },
          { label: "Ingresos Generados", value: `$${totalRevenue.toLocaleString()}`, icon: "💰" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-xs)] relative overflow-hidden group hover:border-[var(--gold)] transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--surface-hover)] rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            <p className="text-2xl mb-3">{stat.icon}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-[var(--text-primary)]">{loading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: "/es/admin/hotels", label: "Gestionar Propiedades", desc: "Añadir o editar detalles del catálogo", icon: "🗝️" },
          { href: "/es/hotels/reviews", label: "Análisis de Reseñas", desc: "Monitoriza el feedback de los huéspedes", icon: "⭐" },
          { href: "/es/hotels", label: "Auditoría Visual", desc: "Navega como un cliente exclusivo", icon: "👁️" },
        ].map((a) => (
          <a key={a.href} href={a.href}
            className="group bg-white rounded-3xl border border-[var(--border)] p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-[var(--surface)] rounded-2xl flex items-center justify-center text-2xl mb-5 border border-[var(--border)] group-hover:border-[var(--gold)] transition-colors">
              {a.icon}
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)]">{a.label}</p>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-1">{a.desc}</p>
          </a>
        ))}
      </div>

      {/* Recent bookings with status actions */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Últimos Movimientos</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--surface)] text-[var(--text-muted)] px-3 py-1 rounded-full border border-[var(--border)]">
            {bookings.length} Registros
          </span>
        </div>
        
        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[var(--surface)] rounded-2xl animate-shimmer" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <span className="text-3xl mb-2 block opacity-50">📂</span>
            <p className="text-sm font-bold text-[var(--text-primary)]">No hay operaciones recientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-[var(--border-soft)]">
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Propiedad & Detalle</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Fechas</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Importe</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Estado</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {bookings.slice(0, 10).map((b: any) => (
                  <tr key={b.id} className="hover:bg-[var(--surface-hover)] transition-colors group">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors">{b.roomType?.hotel?.name}</p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{b.roomType?.name} · {b.guestsCount} pers.</p>
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <p className="text-xs font-bold text-[var(--text-primary)]">{b.checkIn}</p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)]">al {b.checkOut}</p>
                    </td>
                    <td className="py-4 px-4 text-right align-middle">
                      <p className="text-sm font-black text-[var(--text-primary)]">${parseFloat(b.totalPrice ?? "0").toLocaleString()}</p>
                    </td>
                    <td className="py-4 px-4 text-right align-middle">
                      <span className={`inline-block text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${statusColor[b.status] ?? "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]"}`}>
                        {statusLabel[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "PENDING" && (
                          <button
                            onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                          >
                            ✓ Confirmar
                          </button>
                        )}
                        {b.status === "CONFIRMED" && (
                          <button
                            onClick={() => updateBookingStatus(b.id, "COMPLETED")}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
                          >
                            ✓ Completar
                          </button>
                        )}
                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                          <button
                            onClick={() => updateBookingStatus(b.id, "CANCELLED")}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
                          >
                            ✕
                          </button>
                        )}
                      </div>
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