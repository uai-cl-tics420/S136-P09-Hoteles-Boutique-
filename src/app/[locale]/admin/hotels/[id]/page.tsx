"use client";
import { useState, useEffect, use } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const EXTRA_CATEGORIES = ["SPA", "DINING", "TRANSPORT", "EXPERIENCE", "OTHER"];
const EXTRA_CAT_LABELS: Record<string, string> = {
  SPA: "Spa", DINING: "Gastronomía", TRANSPORT: "Transporte", EXPERIENCE: "Experiencia", OTHER: "Otro",
};
const PREF_OPTIONS = [
  "Almohada extra", "Flores frescas", "Minibar vegano", "Cama nido",
  "Desayuno tardío", "Transfer aeropuerto", "Decoración romántica", "Frigorífico sin alcohol",
];

export default function AdminHotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "es";
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"edit" | "rooms" | "extras" | "guest-config">("edit");
  const [guestConfig, setGuestConfig] = useState({
    welcomeMessage: "",
    defaultPreferences: [] as string[],
    checkInTime: "14:00",
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [newExtra, setNewExtra] = useState({ name: "", description: "", price: "", category: "SPA" });
  const [savingExtra, setSavingExtra] = useState(false);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "2", pricePerNight: "", totalRooms: "1", currency: "CLP", description: "", amenities: "" });
  const [savingRoom, setSavingRoom] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/hotels/${id}`).then((r) => r.json()),
      fetch(`/api/admin/guest-config?hotelId=${id}`).then((r) => r.json()).catch(() => ({ config: null })),
      fetch(`/api/admin/hotels/${id}/room-types`).then((r) => r.json()).catch(() => ({ roomTypes: [] })),
    ]).then(([hd, gc, rt]) => {
      setHotel(hd.hotel);
      if (gc.config) setGuestConfig(gc.config);
      setRoomTypes(rt.roomTypes ?? []);
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
      if (res.ok) toast.success("Información actualizada");
      else toast.error("Error al guardar");
    } catch (_err) { toast.error("Error de conexión"); }
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
      if (res.ok) toast.success("Configuración de experiencia guardada");
      else toast.error("Error al guardar");
    } catch (_err) { toast.error("Error de conexión"); }
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
        toast.success("Servicio exclusivo añadido");
        setNewExtra({ name: "", description: "", price: "", category: "SPA" });
        fetch(`/api/hotels/${id}`).then((r) => r.json()).then((d) => setHotel(d.hotel));
      } else toast.error("Error al agregar");
    } catch (_err) { toast.error("Error de conexión"); }
    finally { setSavingExtra(false); }
  }

  async function addRoomType(e: React.FormEvent) {
    e.preventDefault();
    setSavingRoom(true);
    try {
      const amenitiesArr = newRoom.amenities.split(",").map((a) => a.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/hotels/${id}/room-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoom.name,
          capacity: parseInt(newRoom.capacity),
          pricePerNight: parseFloat(newRoom.pricePerNight),
          totalRooms: parseInt(newRoom.totalRooms),
          currency: newRoom.currency,
          description: newRoom.description || null,
          amenities: amenitiesArr,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Tipo de habitación creado");
        setRoomTypes((prev) => [...prev, data.roomType]);
        setNewRoom({ name: "", capacity: "2", pricePerNight: "", totalRooms: "1", currency: "CLP", description: "", amenities: "" });
      } else toast.error("Error al crear");
    } catch { toast.error("Error de conexión"); }
    finally { setSavingRoom(false); }
  }

  function togglePref(p: string) {
    setGuestConfig((prev) => ({
      ...prev,
      defaultPreferences: prev.defaultPreferences.includes(p)
        ? prev.defaultPreferences.filter((x) => x !== p)
        : [...prev.defaultPreferences, p],
    }));
  }

  if (loading) return <div className="animate-shimmer h-64 bg-white rounded-3xl border border-[var(--border)] max-w-4xl" />;
  if (!hotel) return (
    <div className="text-center py-20 bg-white rounded-3xl border border-[var(--border)] max-w-4xl">
      <p className="text-sm font-bold text-[var(--text-primary)] mb-4">Propiedad no encontrada</p>
      <a href={`/${locale}/admin/hotels`} className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)]">← Volver al catálogo</a>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3 bg-[var(--surface)] p-2 rounded-full border border-[var(--border)] w-max">
        <a href={`/${locale}/admin/hotels`} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--surface-hover)]">← Catálogo</a>
        <span className="text-[var(--border)]">|</span>
        <span className="px-4 text-sm font-black text-[var(--text-primary)]">{hotel.name}</span>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-6">
        <a href={`/${locale}/admin/hotels/${id}/availability`}
          className="group bg-white rounded-3xl border border-[var(--border)] p-6 hover:shadow-lg transition-all duration-300 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--surface)] rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="w-14 h-14 bg-[var(--surface)] rounded-2xl flex items-center justify-center text-2xl border border-[var(--border)] group-hover:border-[var(--gold)] transition-colors">
            📅
          </div>
          <div>
            <p className="text-lg font-black text-[var(--text-primary)]">Disponibilidad</p>
            <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Gestionar fechas y precios de la propiedad</p>
          </div>
        </a>
        <a href={`/${locale}/admin/hotels/${id}/bookings`}
          className="group bg-white rounded-3xl border border-[var(--border)] p-6 hover:shadow-lg transition-all duration-300 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--surface)] rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="w-14 h-14 bg-[var(--surface)] rounded-2xl flex items-center justify-center text-2xl border border-[var(--border)] group-hover:border-[var(--gold)] transition-colors">
            📋
          </div>
          <div>
            <p className="text-lg font-black text-[var(--text-primary)]">Libro de Reservas</p>
            <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Revisar agenda de huéspedes exclusivos</p>
          </div>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-[var(--shadow-xs)] w-max">
        {(["edit", "rooms", "extras", "guest-config"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${tab === t ? "bg-[var(--text-primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
            {{ edit: "Detalles", rooms: "Habitaciones", extras: "Exclusividades", "guest-config": "Experiencia" }[t]}
          </button>
        ))}
      </div>

      {/* Tab: rooms */}
      {tab === "rooms" && (
        <div className="space-y-6 animate-slide-up">
          {roomTypes.length > 0 && (
            <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
              <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Tipos de Habitación</h2>
              <div className="space-y-3">
                {roomTypes.map((rt: any) => (
                  <div key={rt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl gap-3">
                    <div>
                      <p className="text-base font-bold text-[var(--text-primary)]">{rt.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
                        {rt.capacity} personas · {rt.totalRooms} hab. ·
                        <span className="text-[var(--gold)] ml-1">${parseFloat(rt.pricePerNight).toLocaleString()} {rt.currency}/noche</span>
                      </p>
                      {rt.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {rt.amenities.map((a: string) => (
                            <span key={a} className="text-[10px] bg-white text-[var(--text-muted)] px-2 py-0.5 rounded-full border border-[var(--border)]">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Añadir Tipo de Habitación</h2>
            <form onSubmit={addRoomType} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Nombre</label>
                  <input required type="text" value={newRoom.name} onChange={(e) => setNewRoom((x) => ({ ...x, name: e.target.value }))}
                    placeholder="Ej: Suite Deluxe" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Capacidad (personas)</label>
                  <input required type="number" min={1} max={20} value={newRoom.capacity} onChange={(e) => setNewRoom((x) => ({ ...x, capacity: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Precio / Noche ($)</label>
                  <input required type="number" min={0} value={newRoom.pricePerNight} onChange={(e) => setNewRoom((x) => ({ ...x, pricePerNight: e.target.value }))}
                    placeholder="0" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">N° Habitaciones</label>
                  <input type="number" min={1} value={newRoom.totalRooms} onChange={(e) => setNewRoom((x) => ({ ...x, totalRooms: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Descripción</label>
                <input type="text" value={newRoom.description} onChange={(e) => setNewRoom((x) => ({ ...x, description: e.target.value }))}
                  placeholder="Descripción de la habitación" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Amenities <span className="normal-case font-normal">(separados por coma)</span></label>
                <input type="text" value={newRoom.amenities} onChange={(e) => setNewRoom((x) => ({ ...x, amenities: e.target.value }))}
                  placeholder="WiFi, TV, Jacuzzi, Vista al mar" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
              </div>
              <div className="pt-4 border-t border-[var(--border-soft)]">
                <button type="submit" disabled={savingRoom}
                  className="bg-[var(--text-primary)] text-white rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-50">
                  {savingRoom ? "Creando..." : "Crear Habitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: edit */}
      {tab === "edit" && (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)] animate-slide-up">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Detalles de la Propiedad</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Nombre Comercial</label>
              <input type="text" value={hotel.name}
                onChange={(e) => setHotel((h: any) => ({ ...h, name: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Manifiesto Público</label>
              <textarea
                value={(hotel.description ?? "").replace(/\[GUEST_CONFIG\][\s\S]*?\[\/GUEST_CONFIG\]/g, "").trim()}
                onChange={(e) => setHotel((h: any) => ({ ...h, description: e.target.value }))}
                rows={5}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors resize-none leading-relaxed" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Clasificación Estrellas</label>
              <input type="number" min={1} max={5} value={hotel.starRating}
                onChange={(e) => setHotel((h: any) => ({ ...h, starRating: parseInt(e.target.value) }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
            </div>
            <div className="pt-4 border-t border-[var(--border-soft)]">
              <button type="submit" disabled={saving}
                className="bg-[var(--gold)] text-white rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600 transition-all shadow-md disabled:opacity-50">
                {saving ? "Guardando..." : "Confirmar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: extras */}
      {tab === "extras" && (
        <div className="space-y-6 animate-slide-up">
          {/* Existing extras */}
          {hotel.extraServices?.length > 0 && (
            <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
              <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Servicios Exclusivos Configurados</h2>
              <div className="space-y-3 stagger-children">
                {hotel.extraServices.map((s: any) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                    <div className="mb-3 sm:mb-0">
                      <p className="text-base font-bold text-[var(--text-primary)]">{s.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">{EXTRA_CAT_LABELS[s.category]} <span className="text-[var(--gold)] mx-1">◆</span> <span className="text-[var(--text-primary)]">${parseFloat(s.price).toLocaleString()}</span></p>
                    </div>
                    <ExtraToggleButton
                      hotelId={id}
                      extraId={s.id}
                      available={s.available}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new extra */}
          <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Añadir Nuevo Servicio</h2>
            <form onSubmit={addExtra} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Nombre Comercial</label>
                  <input type="text" required value={newExtra.name}
                    onChange={(e) => setNewExtra((x) => ({ ...x, name: e.target.value }))}
                    placeholder="Ej: Cena Degustación"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Categoría</label>
                  <select value={newExtra.category}
                    onChange={(e) => setNewExtra((x) => ({ ...x, category: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors">
                    {EXTRA_CATEGORIES.map((c) => <option key={c} value={c}>{EXTRA_CAT_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Detalles del Servicio</label>
                <input type="text" value={newExtra.description}
                  onChange={(e) => setNewExtra((x) => ({ ...x, description: e.target.value }))}
                  placeholder="Descripción de la experiencia para el huésped"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Inversión ($)</label>
                <input type="number" required min={0} value={newExtra.price}
                  onChange={(e) => setNewExtra((x) => ({ ...x, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors" />
              </div>
              <div className="pt-4 border-t border-[var(--border-soft)]">
                <button type="submit" disabled={savingExtra}
                  className="bg-[var(--text-primary)] text-white rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-50">
                  {savingExtra ? "Configurando..." : "Activar Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: guest config */}
      {tab === "guest-config" && (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)] animate-slide-up">
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Diseño de Experiencia</h2>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-8">Personaliza el recorrido digital del huésped previo a su llegada.</p>

          <div className="space-y-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Manifiesto de Bienvenida</label>
              <textarea
                value={guestConfig.welcomeMessage}
                onChange={(e) => setGuestConfig((c) => ({ ...c, welcomeMessage: e.target.value }))}
                rows={4}
                placeholder="Ej: Nos complace prepararnos para su llegada..."
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Carta de Preferencias (Concierge)</label>
              <div className="flex flex-wrap gap-3">
                {PREF_OPTIONS.map((p) => (
                  <button key={p} type="button" onClick={() => togglePref(p)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${guestConfig.defaultPreferences.includes(p) ? "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)] shadow-sm" : "bg-white border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Protocolo de Check-in</label>
              <select value={guestConfig.checkInTime}
                onChange={(e) => setGuestConfig((c) => ({ ...c, checkInTime: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors">
                <option value="12:00">12:00 — Early Check-in Premium</option>
                <option value="13:00">13:00 — Anticipado</option>
                <option value="14:00">14:00 — Estándar</option>
                <option value="15:00">15:00 — Tarde</option>
                <option value="16:00">16:00 — Sunset</option>
              </select>
            </div>

            <div className="pt-6 border-t border-[var(--border-soft)]">
              <button onClick={saveGuestConfig} disabled={savingConfig}
                className="bg-[var(--text-primary)] text-white rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-50">
                {savingConfig ? "Aplicando..." : "Sincronizar Experiencia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExtraToggleButton({ hotelId, extraId, available }: { hotelId: string; extraId: string; available: boolean }) {
  const [isAvailable, setIsAvailable] = useState(available);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/extras/${extraId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !isAvailable }),
      });
      if (res.ok) {
        setIsAvailable(!isAvailable);
        toast.success(`Servicio ${!isAvailable ? 'disponible' : 'pausado'}`);
      } else {
        toast.error("Error al actualizar");
      }
    } catch (_err) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded border w-max transition-all disabled:opacity-50 ${isAvailable
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--border)]"
        }`}
    >
      {loading ? "..." : isAvailable ? "Disponible" : "Pausado"}
    </button>
  );
}