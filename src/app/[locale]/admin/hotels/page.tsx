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
      const res = await fetch("/api/admin/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }
      toast.success("Propiedad añadida al catálogo");
      setHotels(h => [data.hotel, ...h]);
      setShowForm(false);
      setForm({ name: "", locationCity: "", locationCountry: "Chile", category: "BOUTIQUE", starRating: 3, description: "" });
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-8 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Mis Propiedades</h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-2">{hotels.length} propiedades en tu colección exclusiva.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-[var(--text-primary)] text-white rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md">
          {showForm ? "Cancelar Registro" : "+ Nueva Propiedad"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)] animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gold)]" />
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Añadir al Catálogo</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: "Nombre del Hotel", key: "name", type: "text", required: true },
              { label: "Ciudad", key: "locationCity", type: "text", required: true },
              { label: "País", key: "locationCountry", type: "text", required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{f.label}</label>
                <input type={f.type} required={f.required}
                  value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Categoría</label>
              <select value={form.category} onChange={e => setForm(x => ({ ...x, category: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors">
                {["LUXURY","BOUTIQUE","ECO","BEACH","MOUNTAIN","CITY"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Clasificación Estrellas</label>
              <input type="number" min={1} max={5} value={form.starRating}
                onChange={e => setForm(x => ({ ...x, starRating: parseInt(e.target.value) }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Descripción Premium</label>
              <textarea value={form.description} onChange={e => setForm(x => ({ ...x, description: e.target.value }))} rows={4}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors resize-none leading-relaxed" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-4 pt-4 border-t border-[var(--border-soft)]">
              <button type="submit" disabled={saving}
                className="bg-[var(--gold)] text-white rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600 transition-all shadow-md disabled:opacity-50">
                {saving ? "Registrando..." : "Confirmar Registro"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors px-4 py-4">
                Cancelar Operación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hotels list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-3xl h-32 border border-[var(--border)] animate-shimmer" />)}
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-3xl bg-white">
          <span className="text-4xl mb-4 block opacity-50">🏨</span>
          <p className="text-lg font-black text-[var(--text-primary)] mb-1">Catálogo Vacío</p>
          <p className="text-sm font-medium text-[var(--text-muted)]">No tienes propiedades registradas aún. Comienza añadiendo una.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
          {hotels.map((h: any) => (
            <div key={h.id} className="group bg-white rounded-3xl border border-[var(--border)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--surface)] text-[var(--gold)] px-2 py-1 rounded border border-[var(--border)]">{h.category}</span>
                  <span className="text-xs text-[var(--gold)]">{"★".repeat(h.starRating)}</span>
                </div>
                <p className="text-xl font-black text-[var(--text-primary)] truncate group-hover:text-[var(--gold)] transition-colors">{h.name}</p>
                <p className="text-sm font-medium text-[var(--text-muted)] mt-1 truncate">{h.locationCity}, {h.locationCountry}</p>
              </div>
              <a href={`/es/admin/hotels/${h.id}`}
                className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] border border-[var(--border)] rounded-xl px-6 py-3 hover:bg-[var(--text-primary)] hover:text-white transition-all text-center">
                Gestionar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}