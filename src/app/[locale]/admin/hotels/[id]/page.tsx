"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

export default function AdminHotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/hotels/${id}`).then(r => r.json())
      .then(d => { setHotel(d.hotel); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/hotels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hotel.name, description: hotel.description, starRating: hotel.starRating }),
      });
      if (res.ok) toast.success("Hotel actualizado");
      else toast.error("Error al guardar");
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="animate-pulse text-gray-400">Cargando...</div>;
  if (!hotel) return <div><a href="/es/admin/hotels" className="text-sm text-gray-500 hover:underline">← Volver</a><p className="mt-4 text-gray-500">Hotel no encontrado</p></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <a href="/es/admin/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{hotel.name}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="font-semibold text-gray-900 mb-4">Editar hotel</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" value={hotel.name} onChange={e => setHotel((h: any) => ({ ...h, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea value={hotel.description ?? ""} onChange={e => setHotel((h: any) => ({ ...h, description: e.target.value }))} rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estrellas</label>
            <input type="number" min={1} max={5} value={hotel.starRating}
              onChange={e => setHotel((h: any) => ({ ...h, starRating: parseInt(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      <div className="flex gap-3">
        <a href={`/es/admin/hotels/${id}/availability`}
          className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow text-center">
          <p className="text-sm font-medium text-gray-900">Disponibilidad</p>
          <p className="text-xs text-gray-400 mt-1">Gestionar fechas y precios</p>
        </a>
        <a href={`/es/admin/hotels/${id}/bookings`}
          className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow text-center">
          <p className="text-sm font-medium text-gray-900">Reservas</p>
          <p className="text-xs text-gray-400 mt-1">Ver reservas de este hotel</p>
        </a>
      </div>
    </div>
  );
}