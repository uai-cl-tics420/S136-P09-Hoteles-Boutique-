"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", locationCity: "", locationCountry: "Chile", category: "BOUTIQUE", starRating: 3, description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/hotels").then(r => r.json())
      .then(d => { setHotels(d.hotels ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }
      toast.success("Hotel creado");
      setHotels(h => [data.hotel, ...h]);
      setShowForm(false);
      setForm({ name: "", locationCity: "", locationCountry: "Chile", category: "BOUTIQUE", starRating: 3, description: "" });
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mis hoteles</h1>
          <p className="text-sm text-gray-500 mt-1">{hotels.length} hoteles registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">
          + Nuevo hotel
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nuevo hotel</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Nombre", key: "name", type: "text", required: true },
              { label: "Ciudad", key: "locationCity", type: "text", required: true },
              { label: "País", key: "locationCountry", type: "text", required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input type={f.type} required={f.required}
                  value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.category} onChange={e => setForm(x => ({ ...x, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                {["LUXURY","BOUTIQUE","ECO","BEACH","MOUNTAIN","CITY"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estrellas</label>
              <input type="number" min={1} max={5} value={form.starRating}
                onChange={e => setForm(x => ({ ...x, starRating: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(x => ({ ...x, description: e.target.value }))} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Crear hotel"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hotels list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 border border-gray-100 animate-pulse" />)}</div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No tienes hoteles. Crea el primero.</div>
      ) : (
        <div className="space-y-3">
          {hotels.map((h: any) => (
            <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{h.name}</p>
                <p className="text-sm text-gray-400">{h.locationCity}, {h.locationCountry} · {h.category} · {"★".repeat(h.starRating)}</p>
              </div>
              <a href={`/es/admin/hotels/${h.id}`}
                className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                Gestionar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}