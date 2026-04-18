"use client";
import { useState, useEffect, use } from "react";

export default function AdminHotelBookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bookings").then(r => r.json())
      .then(d => {
        const filtered = (d.bookings ?? []).filter((b: any) => b.roomType?.hotelId === id || b.roomType?.hotel?.id === id);
        setBookings(filtered);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [id]);

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700", CONFIRMED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-600", COMPLETED: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/es/admin/hotels/${id}`} className="text-sm text-gray-400 hover:text-gray-900">← Hotel</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">Reservas</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="font-semibold text-gray-900 mb-4">Reservas del hotel</h1>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-400">No hay reservas para este hotel</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.roomType?.name}</p>
                  <p className="text-xs text-gray-400">{b.checkIn} → {b.checkOut} · {b.guestsCount} huéspedes</p>
                  <p className="text-xs text-gray-500 mt-0.5">${parseFloat(b.totalPrice).toLocaleString()} {b.currency}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[b.status] ?? "bg-gray-100 text-gray-600"}`}>
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