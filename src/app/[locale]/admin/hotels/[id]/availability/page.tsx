"use client";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

type DayStatus = "available" | "partial" | "full" | "closed";

interface AvailRecord {
  date: string;
  roomsAvailable: number;
  priceOverride: number | null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

export default function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<AvailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editRooms, setEditRooms] = useState(1);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [totalRooms, setTotalRooms] = useState(10);

  function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
  function dateStr(day: number) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

  useEffect(() => {
    setLoading(true);
    const from = `${year}-${pad(month + 1)}-01`;
    const lastDay = getDaysInMonth(year, month);
    const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    fetch(`/api/hotels/${id}/availability?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => { setAvailability(d.availability ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, year, month]);

  function getRecord(day: number): AvailRecord | undefined {
    return availability.find((a) => a.date === dateStr(day));
  }

  function getDayStatus(day: number): DayStatus {
    const rec = getRecord(day);
    if (!rec) return "available";
    if (rec.roomsAvailable === 0) return "full";
    if (rec.roomsAvailable < totalRooms * 0.4) return "partial";
    return "available";
  }

  function selectDay(day: number) {
    const rec = getRecord(day);
    setSelectedDay(day);
    setEditRooms(rec?.roomsAvailable ?? totalRooms);
    setEditPrice(rec?.priceOverride?.toString() ?? "");
  }

  async function handleSave() {
    if (selectedDay === null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hotels/${id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr(selectedDay),
          roomsAvailable: editRooms,
          priceOverride: editPrice ? parseFloat(editPrice) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability((prev) => {
          const filtered = prev.filter((a) => a.date !== dateStr(selectedDay!));
          return [...filtered, data.availability];
        });
        toast.success(`Disponibilidad actualizada para el ${selectedDay} de ${MONTH_NAMES[month]}`);
      } else { toast.error("Error al guardar"); }
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleBulkClose(days: number[]) {
    if (!confirm(`¿Cerrar disponibilidad para ${days.length} días?`)) return;
    setSaving(true);
    let ok = 0;
    for (const day of days) {
      const res = await fetch(`/api/hotels/${id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr(day), roomsAvailable: 0 }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability((prev) => [...prev.filter((a) => a.date !== dateStr(day)), data.availability]);
        ok++;
      }
    }
    setSaving(false);
    toast.success(`${ok} días cerrados`);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekendDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => {
    const dow = new Date(year, month, d).getDay();
    return dow === 0 || dow === 6;
  });

  const statusColors: Record<DayStatus, string> = {
    available: "bg-green-50 text-green-700 hover:bg-green-100",
    partial: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    full: "bg-red-50 text-red-600 hover:bg-red-100",
    closed: "bg-gray-100 text-gray-400",
  };

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/es/admin/hotels/${id}`} className="text-sm text-gray-400 hover:text-gray-900">← Hotel</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">Disponibilidad</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-700">←</button>
            <h2 className="font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-700">→</button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-100 inline-block"></span>Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block"></span>Poco disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block"></span>Lleno</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1.5">
              {[...Array(35)].map((_, i) => <div key={i} className="aspect-square bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const status = getDayStatus(day);
                const rec = getRecord(day);
                const isSelected = selectedDay === day;
                const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return (
                  <button
                    key={day}
                    onClick={() => !isPast && selectDay(day)}
                    disabled={isPast}
                    className={`aspect-square rounded-xl text-sm font-medium transition-all relative ${isPast ? "opacity-30 cursor-not-allowed bg-gray-50 text-gray-400" : statusColors[status]} ${isSelected ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}
                  >
                    {day}
                    {rec?.priceOverride && (
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bulk actions */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Acciones masivas</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkClose(weekendDays)}
                disabled={saving}
                className="text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cerrar todos los fines de semana
              </button>
              <button
                onClick={() => {
                  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
                    .filter((d) => new Date(year, month, d) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                  handleBulkClose(allDays);
                }}
                disabled={saving}
                className="text-xs border border-red-200 text-red-500 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Cerrar todo el mes
              </button>
            </div>
          </div>
        </div>

        {/* Edit panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 mb-3">Total de habitaciones del hotel</p>
            <input
              type="number"
              min={1}
              value={totalRooms}
              onChange={(e) => setTotalRooms(parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Usado para calcular % de ocupación</p>
          </div>

          {selectedDay !== null ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-medium text-gray-900 mb-4">
                {selectedDay} de {MONTH_NAMES[month]}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Habitaciones disponibles</label>
                  <input
                    type="number"
                    min={0}
                    max={totalRooms}
                    value={editRooms}
                    onChange={(e) => setEditRooms(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {editRooms === 0 ? "🔴 Cerrado" : editRooms < totalRooms * 0.4 ? "🟡 Poco disponible" : "🟢 Disponible"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio especial/noche (opcional)</label>
                  <input
                    type="number"
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Dejar vacío para precio base"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-400">Haz clic en un día del calendario para editar su disponibilidad</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}