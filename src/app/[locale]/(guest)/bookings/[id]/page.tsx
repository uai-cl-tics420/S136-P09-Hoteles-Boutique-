"use client";
import { useState, useEffect, use } from "react";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${id}`).then(r => r.json())
      .then(d => { setBooking(d.booking); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400">Cargando...</div></div>;
  if (!booking) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><a href="/es/bookings" className="text-gray-900 hover:underline">← Volver a reservas</a></div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <a href="/es/bookings" className="text-sm text-gray-500 hover:text-gray-900">← Mis reservas</a>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">{booking.roomType?.hotel?.name}</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400 mb-1">Habitación</p><p className="font-medium text-gray-900">{booking.roomType?.name}</p></div>
            <div><p className="text-gray-400 mb-1">Estado</p><p className="font-medium text-gray-900">{booking.status}</p></div>
            <div><p className="text-gray-400 mb-1">Check-in</p><p className="font-medium text-gray-900">{booking.checkIn}</p></div>
            <div><p className="text-gray-400 mb-1">Check-out</p><p className="font-medium text-gray-900">{booking.checkOut}</p></div>
            <div><p className="text-gray-400 mb-1">Huéspedes</p><p className="font-medium text-gray-900">{booking.guestsCount}</p></div>
            <div><p className="text-gray-400 mb-1">Total</p><p className="font-medium text-gray-900">${parseFloat(booking.totalPrice).toLocaleString()} {booking.currency}</p></div>
          </div>
          {booking.specialRequests && (
            <div><p className="text-gray-400 text-sm mb-1">Solicitudes especiales</p><p className="text-sm text-gray-700">{booking.specialRequests}</p></div>
          )}
        </div>
      </div>
    </main>
  );
}