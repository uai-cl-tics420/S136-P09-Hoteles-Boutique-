"use client";
import { useState, useEffect } from "react";

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

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const totalRevenue = bookings
    .filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.totalPrice ?? "0"), 0);

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-green-50 text-green-700",
    PENDING: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-red-50 text-red-500",
    COMPLETED: "bg-gray-100 text-gray-600",
  };
  const statusLabel: Record<string, string> = {
    CONFIRMED: "Confirmada", PENDING: "Pendiente", CANCELLED: "Cancelada", COMPLETED: "Completada",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Resumen de tu operación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Hoteles activos", value: hotels.length, icon: "🏨" },
          { label: "Confirmadas", value: confirmed, icon: "✅" },
          { label: "Pendientes", value: pending, icon: "⏳" },
          { label: "Ingresos confirmados", value: `$${totalRevenue.toLocaleString()}`, icon: "💰" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xl mb-1">{stat.icon}</p>
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{loading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/es/admin/hotels", label: "Gestionar hoteles", desc: "Crear y editar tus propiedades", icon: "🏨" },
          { href: "/es/hotels/reviews", label: "Ver reseñas", desc: "Rankings y feedback de huéspedes", icon: "⭐" },
          { href: "/es/hotels", label: "Vista del huésped", desc: "Ve tu hotel como lo ven los clientes", icon: "👁️" },
        ].map((a) => (
          <a key={a.href} href={a.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <p className="text-2xl mb-2">{a.icon}</p>
            <p className="text-sm font-medium text-gray-900">{a.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
          </a>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Reservas recientes</h2>
          <span className="text-xs text-gray-400">{bookings.length} total</span>
        </div>
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-400">No hay reservas aún</p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 8).map((b: any) => (
              <div key={b.id} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.roomType?.hotel?.name}</p>
                  <p className="text-xs text-gray-400">{b.checkIn} → {b.checkOut} · {b.guestsCount} huéspedes</p>
                </div>
                <p className="text-sm font-medium text-gray-900 flex-shrink-0">${parseFloat(b.totalPrice ?? "0").toLocaleString()}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[b.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {statusLabel[b.status] ?? b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}