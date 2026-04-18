"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

const EXTRA_CATEGORIES = ["SPA", "DINING", "TRANSPORT", "EXPERIENCE", "OTHER"];
const EXTRA_CAT_LABELS: Record<string, string> = {
  SPA: "Spa", DINING: "Gastronomía", TRANSPORT: "Transporte", EXPERIENCE: "Experiencia", OTHER: "Otro",
};

export default function AdminHotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"edit" | "extras" | "guest-config">("edit");
  const [guestConfig, setGuestConfig] = useState({
    welcomeMessage: "",
    defaultPreferences: [] as string[],
    checkInTime: "14:00",
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [newExtra, setNewExtra] = useState({ name: "", description: "", price: "", category: "SPA" });
  const [savingExtra, setSavingExtra] = useState(false);

  const PREF_OPTIONS = [
    "Almohada extra", "Flores frescas", "Minibar vegano", "Cama nido",
    "Desayuno tardío", "Transfer aeropuerto", "Decoración romántica", "Frigorífico sin alcohol",
  ];

  useEffect(() => {
    Promise.all([
      fetch(`/api/hotels/${id}`).then((r) => r.json()),
      fetch(`/api/admin/guest-config?hotelId=${id}`).then((r) => r.json()).catch(() => ({ config: null })),
    ]).then(([hd, gc]) => {
      setHotel(hd.hotel);
      if (gc.config) setGuestConfig(gc.config);
      setLoading(false);
    }).catch(() => setLoading(false));
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

  async function saveGuestConfig() {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/admin/guest-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: id, config: guestConfig }),
      });
      if (res.ok) toast.success("Configuración guardada");
      else toast.error("Error al guardar");
    } catch { toast.error("Error de conexión"); }
    finally { setSavingConfig(false); }
  }

  async function addExtra(e: React.FormEvent) {
    e.preventDefault();
    setSavingExtra(true);
    try {
      const res = await fetch(`/api/hotels/${id}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExtra, price: parseFloat(newExtra.price) }),
      });
      if (res.ok) {
        toast.success("Servicio extra agregado");
        setNewExtra({ name: "", description: "", price: "", category: "SPA" });
        // Refresh hotel
        fetch(`/api/hotels/${id}`).then((r) => r.json()).then((d) => setHotel(d.hotel));
      } else toast.error("Error al agregar");
    } catch { toast.error("Error de conexión"); }
    finally { setSavingExtra(false); }
  }

  function togglePref(p: string) {
    setGuestConfig((prev) => ({
      ...prev,
      defaultPreferences: prev.defaultPreferences.includes(p)
        ? prev.defaultPreferences.filter((x) => x !== p)
        : [...prev.defaultPreferences, p],
    }));
  }

  if (loading) return <div className="animate-pulse text-gray-400 py-8">Cargando...</div>;
  if (!hotel) return (
    <div>
      <a href="/es/admin/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Volver</a>
      <p className="mt-4 text-gray-500">Hotel no encontrado</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <a href="/es/admin/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{hotel.name}</span>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <a href={`/es/admin/hotels/${id}/availability`}
          className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow text-center">
          <p className="text-lg mb-1">📅</p>
          <p className="text-sm font-medium text-gray-900">Disponibilidad</p>
          <p className="text-xs text-gray-400 mt-0.5">Gestionar fechas y precios</p>
        </a>
        <a href={`/es/admin/hotels/${id}/bookings`}
          className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow text-center">
          <p className="text-lg mb-1">📋</p>
          <p className="text-sm font-medium text-gray-900">Reservas</p>
          <p className="text-xs text-gray-400 mt-0.5">Ver reservas de este hotel</p>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(["edit", "extras", "guest-config"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {{ edit: "Información", extras: "Servicios extra", "guest-config": "Experiencia del huésped" }[t]}
          </button>
        ))}
      </div>

      {/* Tab: edit */}
      {tab === "edit" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Editar información</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del hotel</label>
              <input type="text" value={hotel.name}
                onChange={(e) => setHotel((h: any) => ({ ...h, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción pública</label>
              <textarea
                value={(hotel.description ?? "").replace(/\[GUEST_CONFIG\][\s\S]*?\[\/GUEST_CONFIG\]/g, "").trim()}
                onChange={(e) => setHotel((h: any) => ({ ...h, description: e.target.value }))}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estrellas</label>
              <input type="number" min={1} max={5} value={hotel.starRating}
                onChange={(e) => setHotel((h: any) => ({ ...h, starRating: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <button type="submit" disabled={saving}
              className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      )}

      {/* Tab: extras */}
      {tab === "extras" && (
        <div className="space-y-4">
          {/* Existing extras */}
          {hotel.extraServices?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Servicios configurados</h2>
              <div className="space-y-2">
                {hotel.extraServices.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{EXTRA_CAT_LABELS[s.category]} · ${parseFloat(s.price).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.available ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.available ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new extra */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Agregar servicio extra</h2>
            <form onSubmit={addExtra} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input type="text" required value={newExtra.name}
                    onChange={(e) => setNewExtra((x) => ({ ...x, name: e.target.value }))}
                    placeholder="Ej: Cena privada"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                  <select value={newExtra.category}
                    onChange={(e) => setNewExtra((x) => ({ ...x, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    {EXTRA_CATEGORIES.map((c) => <option key={c} value={c}>{EXTRA_CAT_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input type="text" value={newExtra.description}
                  onChange={(e) => setNewExtra((x) => ({ ...x, description: e.target.value }))}
                  placeholder="Descripción breve del servicio"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Precio ($)</label>
                <input type="number" required min={0} value={newExtra.price}
                  onChange={(e) => setNewExtra((x) => ({ ...x, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <button type="submit" disabled={savingExtra}
                className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {savingExtra ? "Agregando..." : "Agregar servicio"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: guest config */}
      {tab === "guest-config" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Personalización del huésped</h2>
          <p className="text-xs text-gray-400 mb-5">Configura cómo se prepara la experiencia antes de la llegada del huésped</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje de bienvenida</label>
              <textarea
                value={guestConfig.welcomeMessage}
                onChange={(e) => setGuestConfig((c) => ({ ...c, welcomeMessage: e.target.value }))}
                rows={3}
                placeholder="Ej: Estimado huésped, nos complace recibirle..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Preferencias que ofrecerás a los huéspedes</label>
              <div className="flex flex-wrap gap-2">
                {PREF_OPTIONS.map((p) => (
                  <button key={p} type="button" onClick={() => togglePref(p)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${guestConfig.defaultPreferences.includes(p) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora de check-in estándar</label>
              <select value={guestConfig.checkInTime}
                onChange={(e) => setGuestConfig((c) => ({ ...c, checkInTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="12:00">12:00 — Early check-in</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00 — Estándar</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
              </select>
            </div>

            <button onClick={saveGuestConfig} disabled={savingConfig}
              className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {savingConfig ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}