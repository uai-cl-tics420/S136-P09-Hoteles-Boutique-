"use client";
import { useState, use } from "react";
import { toast } from "sonner";

export default function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [date, setDate] = useState("");
  const [rooms, setRooms] = useState(1);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/hotels/${id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, roomsAvailable: rooms, priceOverride: price || undefined }),
      });
      if (res.ok) { toast.success("Disponibilidad actualizada"); setDate(""); setRooms(1); setPrice(""); }
      else toast.error("Error al guardar");
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-3">
        <a href={`/es/admin/hotels/${id}`} className="text-sm text-gray-400 hover:text-gray-900">← Hotel</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">Disponibilidad</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="font-semibold text-gray-900 mb-4">Configurar disponibilidad</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Habitaciones disponibles</label>
            <input type="number" min={0} required value={rooms} onChange={e => setRooms(parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio especial (opcional)</label>
            <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)}
              placeholder="Dejar vacío para usar precio base"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar disponibilidad"}
          </button>
        </form>
      </div>
    </div>
  );
}