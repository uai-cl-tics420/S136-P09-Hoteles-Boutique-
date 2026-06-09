"use client";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

/* ─── Types ────────────────────────────────────────────────── */
type Analytics = {
  kpis: {
    totalRevenue: number;
    totalBookings: number;
    totalPending: number;
    totalConfirmed: number;
    totalHotels: number;
    avgRating: number;
  };
  hotelStats: {
    id: string; name: string; category: string;
    totalBookings: number; confirmed: number; completed: number;
    pending: number; cancelled: number; revenue: number;
    avgRating: number | null; reviewCount: number;
  }[];
  monthlyChart: { month: string; label: string; count: number; revenue: number }[];
  statusDist: { name: string; value: number; color: string }[];
};

/* ─── Custom Tooltip ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 py-4 shadow-xl text-sm">
      <p className="font-black text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color ?? p.fill }}>
          {p.name}: {p.name === "Ingresos" ? `$${Number(p.value).toLocaleString("es-CL")}` : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-xs)] relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${color}`} />
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${color} bg-opacity-10`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-3xl font-black text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs font-medium text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"reservas" | "ingresos">("reservas");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d.analytics); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const CAT_COLORS: Record<string, string> = {
    LUXURY: "#8b5cf6", BOUTIQUE: "#f43f5e", ECO: "#10b981",
    BEACH: "#0ea5e9", MOUNTAIN: "#f59e0b", CITY: "#6b7280",
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div className="h-12 bg-white rounded-2xl border border-[var(--border)] animate-shimmer w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white rounded-3xl border border-[var(--border)] animate-shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-80 bg-white rounded-3xl border border-[var(--border)] animate-shimmer" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[var(--border)] max-w-md">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-lg font-black text-[var(--text-primary)]">Sin datos de analytics</p>
        <p className="text-sm text-[var(--text-muted)] mt-2">Agrega propiedades y reservas para ver los gráficos.</p>
      </div>
    );
  }

  const { kpis, hotelStats, monthlyChart, statusDist } = data;

  // Radar data para comparar hoteles
  const radarData = hotelStats.slice(0, 6).map((h) => ({
    hotel: h.name.split(" ").slice(0, 2).join(" "),
    Reservas: h.totalBookings,
    Ingresos: Math.round(h.revenue / 1000),
    Rating: Math.round((h.avgRating ?? 0) * 20),
  }));

  return (
    <div className="space-y-10 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1">
            Inteligencia de Negocio
          </p>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Analytics
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
            Desempeño de tu colección en los últimos 6 meses.
          </p>
        </div>
        <div className="flex gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-[var(--shadow-xs)]">
          {(["reservas", "ingresos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveChart(t)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                activeChart === t
                  ? "bg-[var(--text-primary)] text-white shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t === "reservas" ? "Reservas" : "Ingresos"}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        <KpiCard
          label="Ingresos Totales"
          value={`$${Math.round(kpis.totalRevenue / 1000)}K`}
          icon="💰" color="bg-[var(--gold)]"
          sub={`${kpis.totalBookings} reservas`}
        />
        <KpiCard
          label="Reservas"
          value={kpis.totalBookings}
          icon="🛎️" color="bg-emerald-500"
          sub={`${kpis.totalConfirmed} confirmadas`}
        />
        <KpiCard
          label="Pendientes"
          value={kpis.totalPending}
          icon="⏳" color="bg-amber-500"
          sub="Por procesar"
        />
        <KpiCard
          label="Propiedades"
          value={kpis.totalHotels}
          icon="🏨" color="bg-purple-500"
          sub="En tu colección"
        />
        <KpiCard
          label="Rating Promedio"
          value={kpis.avgRating > 0 ? `${kpis.avgRating.toFixed(1)} ★` : "—"}
          icon="⭐" color="bg-yellow-500"
          sub="Satisfacción global"
        />
        <KpiCard
          label="Tasa Confirmación"
          value={kpis.totalBookings > 0 ? `${Math.round((kpis.totalConfirmed / kpis.totalBookings) * 100)}%` : "—"}
          icon="✅" color="bg-sky-500"
          sub="Sobre total reservas"
        />
      </div>

      {/* ── Main Chart + Pie ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area / Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-1">
            {activeChart === "reservas" ? "Reservas por Mes" : "Ingresos por Mes"}
          </h2>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-6">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={260}>
            {activeChart === "reservas" ? (
              <AreaChart data={monthlyChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9c9589", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9c9589", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Reservas"
                  stroke="#c9a84c"
                  strokeWidth={3}
                  fill="url(#colorCount)"
                  dot={{ r: 5, fill: "#c9a84c", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: "#c9a84c", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={monthlyChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a1917" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#1a1917" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9c9589", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9c9589", fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Ingresos" fill="url(#colorRev)" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — distribución de estados */}
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)] flex flex-col">
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-1">Estado de Reservas</h2>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-6">Distribución global</p>
          {statusDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [v, name]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e0d5", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusDist.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">{s.name}</span>
                    </div>
                    <span className="text-xs font-black text-[var(--text-primary)]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)] text-center">Sin reservas aún</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Hotel Performance Table + Radar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Radar chart — comparación entre hoteles */}
        {radarData.length > 1 && (
          <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-1">Comparativa</h2>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-4">Desempeño relativo</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f0ede6" />
                <PolarAngleAxis dataKey="hotel" tick={{ fontSize: 10, fill: "#9c9589", fontWeight: 600 }} />
                <Radar name="Reservas" dataKey="Reservas" stroke="#c9a84c" fill="#c9a84c" fillOpacity={0.2} />
                <Radar name="Rating" dataKey="Rating" stroke="#1a1917" fill="#1a1917" fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Performance table */}
        <div className={`${radarData.length > 1 ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]`}>
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-6">Rendimiento por Propiedad</h2>
          {hotelStats.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin propiedades registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-[var(--border-soft)]">
                    {["Propiedad", "Reservas", "Confirmadas", "Ingresos", "Rating"].map((h) => (
                      <th key={h} className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {hotelStats
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((h, i) => (
                      <tr key={h.id} className="hover:bg-[var(--surface-hover)] transition-colors group">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-black w-7 text-center ${i === 0 ? "text-[var(--gold)]" : "text-[var(--border)]"}`}>
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors">
                                {h.name}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: CAT_COLORS[h.category] ?? "#6b7280" }}
                                />
                                {h.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-sm font-black text-[var(--text-primary)]">{h.totalBookings}</span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-700">{h.confirmed}</span>
                            {h.totalBookings > 0 && (
                              <div className="flex-1 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden w-16">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.round((h.confirmed / h.totalBookings) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-sm font-black text-[var(--text-primary)]">
                            ${Math.round(h.revenue / 1000)}K
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] font-medium">CLP</p>
                        </td>
                        <td className="py-4 px-2">
                          {h.avgRating ? (
                            <span className="inline-flex items-center gap-1 text-sm font-black text-[var(--gold)]">
                              {h.avgRating.toFixed(1)} <span className="text-xs">★</span>
                              <span className="text-[10px] font-medium text-[var(--text-muted)]">
                                ({h.reviewCount})
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">Sin reseñas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Revenue Bar Chart per hotel ─────────────────── */}
      {hotelStats.length > 1 && (
        <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-1">Ingresos por Propiedad</h2>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-6">Comparativa de rendimiento económico</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={hotelStats.map((h) => ({
                name: h.name.split(" ").slice(0, 2).join(" "),
                revenue: h.revenue,
                fill: CAT_COLORS[h.category] ?? "#6b7280",
              }))}
              margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9c9589", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9c9589", fontWeight: 600 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${Math.round(v / 1000)}K`}
              />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString("es-CL")}`, "Ingresos"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e0d5", fontSize: "12px" }}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {hotelStats.map((h, i) => (
                  <Cell key={i} fill={CAT_COLORS[h.category] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Color legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              hotelStats.some(h => h.category === cat) && (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{cat}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
