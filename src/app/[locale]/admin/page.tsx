"use client";
import { useState, useEffect } from "react";

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/bookings").then(r => r.json()),
      fetch("/api/hotels").then(r => r.json()),
    ]).then(([b, h]) => {
      setBookings(b.bookings ?? []);
      setHotels(h.hotels ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const pending = bookings.filter(b => b.status === "PENDING").length;
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de tu operación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Hoteles activos", value: hotels.length },
          { label: "Reservas confirmadas", value: confirmed },
          { label: "Reservas pendientes", value: pending },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-semibold text-gray-900">{loading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Reservas recientes</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-400">No hay reservas aún</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.roomType?.hotel?.name}</p>
                  <p className="text-xs text-gray-400">{b.checkIn} → {b.checkOut}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${b.status === "CONFIRMED" ? "bg-green-50 text-green-700" : b.status === "PENDING" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}