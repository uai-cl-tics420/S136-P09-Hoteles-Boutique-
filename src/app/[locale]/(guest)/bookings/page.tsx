"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", CANCELLED: "Cancelada", COMPLETED: "Completada",
};
const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700", CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-600", COMPLETED: "bg-gray-100 text-gray-600",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings").then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function cancelBooking(id: string) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Reserva cancelada");
      setBookings(b => b.map(x => x.id === id ? { ...x, status: "CANCELLED" } : x));
    } else { toast.error("No se pudo cancelar"); }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/es/hotels" className="text-sm text-gray-500 hover:text-gray-900">← Hoteles</a>
            <span className="text-sm font-semibold text-gray-900">Mis reservas</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse h-24" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No tienes reservas aún</p>
            <a href="/es/hotels" className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
              Explorar hoteles
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b: any) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{b.roomType?.hotel?.name ?? "Hotel"}</p>
                    <p className="text-sm text-gray-500 mt-1">{b.roomType?.name}</p>
                    <p className="text-sm text-gray-500">
                      {b.checkIn} → {b.checkOut}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-2">
                      Total: ${parseFloat(b.totalPrice).toLocaleString()} {b.currency}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[b.status]}`}>
                      {statusLabel[b.status] ?? b.status}
                    </span>
                    {b.status === "CONFIRMED" && (
                      <button onClick={() => cancelBooking(b.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}