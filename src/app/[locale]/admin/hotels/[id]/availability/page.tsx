"use client";
import { useState, useEffect, use } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { loadTranslations } from "@/i18n/i18n-util";

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

const MONTH_NAMES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAY_NAMES_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "es";
  const [t, setT] = useState<any>(null);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("");
  const [availability, setAvailability] = useState<AvailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editRooms, setEditRooms] = useState(1);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const MONTH_NAMES = locale === "es" ? MONTH_NAMES_ES : MONTH_NAMES_EN;
  const DAY_NAMES = locale === "es" ? DAY_NAMES_ES : DAY_NAMES_EN;

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  if (!t) return null;

  const selectedRoomType = roomTypes.find((r) => r.id === selectedRoomTypeId);
  const totalRooms = selectedRoomType?.totalRooms || 1;

  useEffect(() => {
    fetch(`/api/admin/hotels/${id}/room-types`)
      .then((r) => r.json())
      .then((d) => {
        const rooms = d.roomTypes ?? [];
        setRoomTypes(rooms);
        if (rooms.length > 0) setSelectedRoomTypeId(rooms[0].id);
      })
      .catch(() => {});
  }, [id]);

  function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
  function dateStr(day: number) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

  useEffect(() => {
    if (!selectedRoomTypeId) return;
    setLoading(true);
    const from = `${year}-${pad(month + 1)}-01`;
    const lastDay = getDaysInMonth(year, month);
    const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    fetch(`/api/hotels/${selectedRoomTypeId}/availability?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => { setAvailability(d.availability ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedRoomTypeId, year, month]);

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
      const res = await fetch(`/api/hotels/${selectedRoomTypeId}/availability`, {
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
        toast.success(`${t("admin.availability.availabilityUpdated")} ${selectedDay} ${t("admin.availability.daysClosed")}`);
      } else { toast.error("Error al guardar"); }
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function handleBulkClose(days: number[]) {
    if (!confirm(`${t("admin.availability.closeConfirm")} ${days.length} ${t("admin.availability.days")}?`)) return;
    setSaving(true);
    let ok = 0;
    for (const day of days) {
      const res = await fetch(`/api/hotels/${selectedRoomTypeId}/availability`, {
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
    toast.success(`${ok} ${t("admin.availability.daysClosed")}`);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekendDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => {
    const dow = new Date(year, month, d).getDay();
    return dow === 0 || dow === 6;
  });

  const statusBg: Record<DayStatus, string> = {
    available: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100",
    partial: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100",
    full: "bg-red-50 text-red-600 hover:bg-red-100 border-red-100",
    closed: "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]",
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

  const occupiedDays = availability.filter(a => a.roomsAvailable === 0).length;
  const partialDays = availability.filter(a => a.roomsAvailable > 0 && a.roomsAvailable < totalRooms * 0.4).length;

  return (
    <div className="space-y-8 max-w-6xl animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 bg-[var(--surface)] p-2 rounded-full border border-[var(--border)] w-max">
        <a href={`/${locale}/admin/hotels/${id}`}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--surface-hover)]">
          {t("admin.availability.breadcrumbProperty")}
        </a>
        <span className="text-[var(--border)]">|</span>
        <span className="px-4 text-sm font-black text-[var(--text-primary)]">{t("admin.availability.management")}</span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("admin.availability.daysAvailable"), value: daysInMonth - occupiedDays - partialDays, icon: "🟢", color: "text-emerald-600" },
          { label: t("admin.availability.lowOccupancy"), value: partialDays, icon: "🟡", color: "text-amber-600" },
          { label: t("admin.availability.closedFull"), value: occupiedDays, icon: "🔴", color: "text-red-500" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-3xl border border-[var(--border)] p-5 shadow-[var(--shadow-xs)] flex items-center gap-4">
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--text-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all font-bold">
              ←
            </button>
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
              {MONTH_NAMES[month]} <span className="text-[var(--text-muted)] font-medium">{year}</span>
            </h2>
            <button onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--text-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all font-bold">
              →
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-5 flex-wrap">
            {[
              { color: "bg-emerald-100 border-emerald-200", label: t("admin.availability.availableLabel") },
              { color: "bg-amber-100 border-amber-200", label: t("admin.availability.littleAvailable") },
              { color: "bg-red-100 border-red-200", label: t("admin.availability.fullClosed") },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                <span className={`w-3.5 h-3.5 rounded-sm border ${l.color} inline-block`} />
                {l.label}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1.5">
              {[...Array(35)].map((_, i) => <div key={i} className="aspect-square bg-[var(--surface)] rounded-xl animate-shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] py-1">{d}</div>
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
                    className={`aspect-square rounded-xl text-sm font-bold transition-all relative border ${
                      isPast
                        ? "opacity-25 cursor-not-allowed bg-[var(--surface)] text-[var(--text-muted)] border-transparent"
                        : statusBg[status]
                    } ${isSelected ? "ring-2 ring-[var(--text-primary)] ring-offset-2 scale-105 shadow-md" : ""}`}
                  >
                    {day}
                    {rec?.priceOverride && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bulk actions */}
          <div className="mt-6 pt-5 border-t border-[var(--border-soft)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{t("admin.availability.bulkActions")}</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleBulkClose(weekendDays)}
                disabled={saving}
                className="text-xs font-bold uppercase tracking-widest border border-[var(--border)] text-[var(--text-muted)] rounded-xl px-4 py-2.5 hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all disabled:opacity-50"
              >
                {t("admin.availability.closeWeekends")}
              </button>
              <button
                onClick={() => {
                  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
                    .filter((d) => new Date(year, month, d) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                  handleBulkClose(allDays);
                }}
                disabled={saving}
                className="text-xs font-bold uppercase tracking-widest border border-red-200 text-red-500 rounded-xl px-4 py-2.5 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
              >
                {t("admin.availability.closeMonth")}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">

          {/* Total rooms config */}
          <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-xs)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{t("admin.availability.selectRoomType")}</p>
            {roomTypes.length === 0 ? (
              <p className="text-sm font-medium text-amber-600">{t("admin.availability.noRooms")}</p>
            ) : (
              <select
                value={selectedRoomTypeId}
                onChange={(e) => {
                  setSelectedRoomTypeId(e.target.value);
                  setSelectedDay(null);
                }}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name} (Total: {rt.totalRooms})</option>
                ))}
              </select>
            )}
            <p className="text-[10px] font-medium text-[var(--text-muted)] mt-2">{t("admin.availability.totalCapacity")}: {totalRooms} {t("admin.availability.capacity")}</p>
          </div>

          {/* Day editor */}
          {selectedDay !== null ? (
            <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-xs)] animate-slide-up">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[var(--text-primary)] rounded-2xl flex items-center justify-center text-white font-black text-sm">
                  {selectedDay}
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)]">{MONTH_NAMES[month]} {year}</p>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">{t("admin.availability.editAvailability")}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    {t("admin.availability.roomsAvailable")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalRooms}
                    value={editRooms}
                    onChange={(e) => setEditRooms(parseInt(e.target.value))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors"
                  />
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${
                    editRooms === 0 ? "text-red-500" : editRooms < totalRooms * 0.4 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {editRooms === 0 ? t("admin.availability.closed") : editRooms < totalRooms * 0.4 ? t("admin.availability.lowAvailability") : t("admin.availability.available")}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    {t("admin.availability.specialPrice")} <span className="normal-case font-normal">{t("admin.availability.specialPriceOptional")}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder={t("admin.availability.useBasePrice")}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-colors placeholder:font-normal"
                  />
                  {editPrice && (
                    <p className="text-[10px] font-bold text-[var(--gold)] mt-2">{t("admin.availability.specialPriceSet")} ${parseFloat(editPrice).toLocaleString()}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[var(--text-primary)] text-white rounded-xl py-3 text-sm font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all shadow-md"
                  >
                    {saving ? t("admin.availability.saving") : t("admin.availability.confirmChanges")}
                  </button>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="w-full border border-[var(--border)] text-[var(--text-muted)] rounded-xl py-3 text-sm font-bold uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
                  >
                    {t("admin.availability.cancel")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-3xl p-8 text-center">
              <span className="text-3xl block mb-3 opacity-50">📅</span>
              <p className="text-sm font-bold text-[var(--text-primary)] mb-1">{t("admin.availability.selectDay")}</p>
              <p className="text-xs font-medium text-[var(--text-muted)]">{t("admin.availability.selectDayDesc")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}