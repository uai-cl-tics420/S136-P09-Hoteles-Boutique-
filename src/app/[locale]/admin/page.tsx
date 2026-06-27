"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { loadTranslations } from "@/i18n/i18n-util";

const REFRESH_INTERVAL = 30; // seconds

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "es";
  const [bookings, setBookings] = useState<any[]>([]);
  const [hotels, setHotels]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown]    = useState(REFRESH_INTERVAL);
  const [pulse, setPulse]            = useState(false); // flash on refresh
  const [t, setT] = useState<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadTranslations(locale as any).then(setT); }, [locale]);

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [b, h] = await Promise.all([
        fetch("/api/admin/bookings").then(r => r.json()),
        fetch("/api/hotels").then(r => r.json()),
      ]);
      setBookings(b.bookings ?? []);
      setHotels(h.hotels   ?? []);
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    } catch {
      if (showSpinner) toast.error("Error al actualizar");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh + countdown
  useEffect(() => {
    fetchData();

    const refreshTimer = setInterval(() => fetchData(), REFRESH_INTERVAL * 1000);

    setCountdown(REFRESH_INTERVAL);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) return REFRESH_INTERVAL;
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData]);

  async function updateBookingStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const label: Record<string, string> = {
        CONFIRMED: t?.("bookings.status.CONFIRMED") ?? "Confirmado",
        PENDING:   t?.("bookings.status.PENDING")   ?? "Pendiente",
        CANCELLED: t?.("bookings.status.CANCELLED") ?? "Cancelado",
        COMPLETED: t?.("bookings.status.COMPLETED") ?? "Completado",
      };
      toast.success(`Estado cambiado a: ${label[status] ?? status}`);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } else {
      toast.error("Error al actualizar");
    }
  }

  const pending   = bookings.filter(b => b.status === "PENDING").length;
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
  const totalRevenue = bookings
    .filter(b => ["CONFIRMED","COMPLETED"].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.totalPrice ?? "0"), 0);

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-red-50 text-red-500 border-red-200",
    COMPLETED: "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]",
  };

  if (!t) return null;

  const statusLabel: Record<string, string> = {
    CONFIRMED: t("bookings.status.CONFIRMED"),
    PENDING:   t("bookings.status.PENDING"),
    CANCELLED: t("bookings.status.CANCELLED"),
    COMPLETED: t("bookings.status.COMPLETED"),
  };

  // Countdown ring: fraction 0→1
  const fraction = countdown / REFRESH_INTERVAL;
  const r = 10;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="space-y-10 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
            {t("admin.title")}
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
            {t("admin.dashboard.managePropertiesDesc")}
          </p>
        </div>

        {/* Live refresh controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
            pulse
              ? "bg-emerald-50 border-emerald-300"
              : "bg-white border-[var(--border)]"
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${pulse ? "bg-emerald-500" : "bg-emerald-400"}`} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Live</span>
          </div>

          {/* Countdown ring + refresh button */}
          <button
            onClick={() => { fetchData(true); setCountdown(REFRESH_INTERVAL); }}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--gold)] hover:text-[var(--gold)] text-[var(--text-muted)] transition-all duration-200 disabled:opacity-50 shadow-[var(--shadow-xs)]"
            title={`Próxima actualización en ${countdown}s`}
          >
            {refreshing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 26 26">
                <circle cx="13" cy="13" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle
                  cx="13" cy="13" r={r}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear" }}
                />
                <text x="13" y="17" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--text-primary)">{countdown}</text>
              </svg>
            )}
            {t("admin.dashboard.refresh")}
          </button>

          {lastUpdated && (
            <p className="text-[10px] text-[var(--text-muted)] font-medium hidden sm:block">
              {lastUpdated.toLocaleTimeString(locale === "en" ? "en" : "es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* ── KPI Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 stagger-children">
        {[
          { label: t("admin.dashboard.activeProperties"), value: hotels.length,                        icon: "🏨", color: "from-slate-100 to-slate-50",    border: "border-slate-200" },
          { label: t("admin.dashboard.confirmedBookings"), value: confirmed,                            icon: "✅", color: "from-emerald-50 to-white",       border: "border-emerald-200" },
          { label: t("admin.dashboard.pendingBookings"),   value: pending,                              icon: "⏳", color: "from-amber-50 to-white",         border: "border-amber-200" },
          { label: "Canceladas",                           value: cancelled,                            icon: "✕",  color: "from-red-50 to-white",           border: "border-red-200" },
          { label: t("admin.dashboard.totalRevenue"),      value: `$${Math.round(totalRevenue).toLocaleString("es-CL")}`, icon: "💰", color: "from-[var(--gold-lighter)] to-white", border: "border-[var(--gold)]/20" },
        ].map(stat => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} rounded-3xl border ${stat.border} p-5 shadow-[var(--shadow-xs)] relative overflow-hidden group hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300 ${pulse ? "ring-1 ring-[var(--gold)]/20" : ""}`}
          >
            <p className="text-2xl mb-3">{stat.icon}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 leading-tight">{stat.label}</p>
            <p className={`text-2xl font-black text-[var(--text-primary)] transition-all duration-500 ${loading ? "opacity-30" : "opacity-100"}`}>
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Quick actions ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: `/${locale}/admin/hotels`,    label: t("admin.dashboard.manageProperties"), desc: t("admin.dashboard.managePropertiesDesc"), icon: "🗝️" },
          { href: `/${locale}/admin/stack`,     label: "Stack & Métricas",                   desc: "BD en vivo, arquitectura y escalabilidad",   icon: "⚡" },
          { href: `/${locale}/admin/analytics`, label: "Analytics",                           desc: "Ingresos, gráficos y top hoteles",           icon: "📊" },
          { href: `/${locale}/reviews`,         label: t("admin.dashboard.reviewsAnalysis"),  desc: t("admin.dashboard.reviewsAnalysisDesc"),  icon: "⭐" },
          { href: `/${locale}/hotels`,          label: "Vista de Cliente",                    desc: "Navega como un huésped exclusivo",         icon: "👁️" },
        ].map(a => (
          <a key={a.href} href={a.href}
            className="group bg-white rounded-3xl border border-[var(--border)] p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center text-2xl mb-4 border border-[var(--border)] group-hover:border-[var(--gold)] group-hover:bg-[var(--gold-lighter)] transition-colors">
              {a.icon}
            </div>
            <p className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors">{a.label}</p>
            <p className="text-xs font-medium text-[var(--text-muted)] mt-1">{a.desc}</p>
          </a>
        ))}
      </div>

      {/* ── Bookings status bar ─────────────────────────────────── */}
      {!loading && bookings.length > 0 && (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-xs)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Distribución de reservas</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {confirmed > 0  && <div title={`Confirmadas: ${confirmed}`}  className="bg-emerald-400 transition-all duration-700 rounded-full" style={{ flex: confirmed }}  />}
            {pending > 0    && <div title={`Pendientes: ${pending}`}     className="bg-amber-400  transition-all duration-700 rounded-full" style={{ flex: pending }}    />}
            {cancelled > 0  && <div title={`Canceladas: ${cancelled}`}   className="bg-red-400    transition-all duration-700 rounded-full" style={{ flex: cancelled }}  />}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] font-bold text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"/>Confirmadas {confirmed}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block"/>Pendientes {pending}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block"/>Canceladas {cancelled}</span>
          </div>
        </div>
      )}

      {/* ── Recent bookings table ──────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[var(--text-primary)]">{t("admin.dashboard.recentBookings")}</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--surface-2)] text-[var(--text-muted)] px-3 py-1 rounded-full border border-[var(--border)]">
            {bookings.length} {t("admin.bookings")}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-[var(--surface-2)] rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <span className="text-4xl mb-3 block opacity-30">📂</span>
            <p className="text-sm font-bold text-[var(--text-primary)]">{t("admin.dashboard.noBookings")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-[var(--border-soft)]">
                  {["Propiedad & Detalle","Fechas","Importe","Estado","Acción"].map(h => (
                    <th key={h} className={`pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ${h !== "Propiedad & Detalle" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {bookings.slice(0, 12).map((b: any) => (
                  <tr key={b.id} className="hover:bg-[var(--surface-2)] transition-colors group">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors line-clamp-1">{b.roomType?.hotel?.name}</p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{b.roomType?.name} · {b.guestsCount} {t("guests")}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-[var(--text-primary)]">{b.checkIn}</p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)]">{t("bookings.page.to")} {b.checkOut}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm font-black text-[var(--text-primary)]">${parseFloat(b.totalPrice ?? "0").toLocaleString("es-CL")}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-block text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${statusColor[b.status] ?? "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]"}`}>
                        {statusLabel[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "PENDING" && (
                          <button onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                            ✓ {t("confirm")}
                          </button>
                        )}
                        {b.status === "CONFIRMED" && (
                          <button onClick={() => updateBookingStatus(b.id, "COMPLETED")}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap">
                            ✓ {t("bookings.status.COMPLETED")}
                          </button>
                        )}
                        {["PENDING","CONFIRMED"].includes(b.status) && (
                          <button onClick={() => updateBookingStatus(b.id, "CANCELLED")}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors">
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}