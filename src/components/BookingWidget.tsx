"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loadTranslations } from "@/i18n/i18n-util";

interface RoomType {
  id: string; name: string; pricePerNight: string;
  capacity: number; description?: string | null; amenities?: string[];
}
interface ExtraService {
  id: string; name: string; description?: string | null;
  price: string; category: string; available: boolean;
}
interface Props {
  hotelSlug: string; roomTypes: RoomType[];
  extraServices: ExtraService[]; locale: string; isLoggedIn?: boolean;
}

const EXTRA_ICONS: Record<string, string> = {
  SPA: "💆", DINING: "🕯️", TRANSPORT: "🚗", EXPERIENCE: "🗺️", OTHER: "✨",
};

export default function BookingWidget({ hotelSlug, roomTypes, extraServices, locale, isLoggedIn = false }: Props) {
  const [checkIn, setCheckIn]     = useState("");
  const [checkOut, setCheckOut]   = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [specialRequests, setSpecialRequests] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [booking, setBooking]     = useState(false);
  const [t, setT]                 = useState<any>(null);

  useEffect(() => { loadTranslations(locale as any).then(setT); }, [locale]);
  if (!t) return null;

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;
  const selectedRoomObj = roomTypes.find(r => r.id === selectedRoom);
  const roomTotal   = selectedRoomObj ? parseFloat(selectedRoomObj.pricePerNight) * nights : 0;
  const extrasTotal = [...selectedExtras].reduce((acc, id) => {
    const e = extraServices.find(s => s.id === id);
    return acc + (e ? parseFloat(e.price) : 0);
  }, 0);
  const grandTotal  = roomTotal + extrasTotal;
  const isReady     = selectedRoom && checkIn && checkOut && nights > 0;
  const today       = new Date().toISOString().split("T")[0];
  const availExtras = extraServices.filter(s => s.available);

  function toggleExtra(id: string) {
    setSelectedExtras(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleBook() {
    if (!selectedRoom || !checkIn || !checkOut || nights <= 0) { toast.error(t("bookings.completeFields")); return; }
    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: selectedRoom, checkIn, checkOut, guestsCount,
          specialRequests: specialRequests || undefined,
          extras: [...selectedExtras].map(id => ({ extraServiceId: id, quantity: 1 })),
        }),
      });
      if (res.status === 401) {
        toast.error(t("auth.loginRequired"), { description: t("auth.redirectingToLogin"), duration: 3000 });
        setTimeout(() => { window.location.href = `/${locale}/auth/login`; }, 1800);
        return;
      }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? t("bookings.bookingError")); return; }
      toast.success(t("bookings.bookingSuccess"), { description: t("bookings.bookingSuccessDesc") });
      setTimeout(() => {
        const bid = data.booking?.id;
        window.location.href = bid ? `/${locale}/bookings/${bid}` : `/${locale}/bookings`;
      }, 1500);
    } catch { toast.error(t("bookings.connectionError")); }
    finally { setBooking(false); }
  }

  return (
    <div className="bg-white rounded-[2rem] border border-[var(--border)] shadow-[var(--shadow-lg)] sticky top-20 overflow-hidden">

      {/* ── Dark Header ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[var(--text-primary)] px-7 pt-7 pb-8">
        {/* Gold accent orb */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-[var(--gold)]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />

        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1.5 relative z-10">
          {t("bookings.exclusiveReservation")}
        </p>
        <h2 className="text-2xl font-black text-white relative z-10 tracking-[-0.02em]">{t("bookings.secureStay")}</h2>
        {selectedRoomObj && nights > 0 && (
          <div className="flex items-center gap-2 mt-3 relative z-10">
            <span className="text-[10px] font-bold text-[var(--gold)] bg-[var(--gold)]/15 border border-[var(--gold)]/25 px-3 py-1 rounded-full">
              {selectedRoomObj.name}
            </span>
            <span className="text-[10px] font-bold text-white/50">
              {nights} {nights === 1 ? t("night") : t("nights")}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">

        {/* ── Dates ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t("bookings.checkIn"),  value: checkIn,  min: today, onChange: (v: string) => { setCheckIn(v); if (checkOut && v >= checkOut) setCheckOut(""); } },
            { label: t("bookings.checkOut"), value: checkOut, min: checkIn || today, onChange: setCheckOut },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1.5">{f.label}</label>
              <input
                type="date" value={f.value} min={f.min}
                onChange={e => f.onChange(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)] focus:bg-white transition-all"
              />
            </div>
          ))}
        </div>

        {/* ── Guests stepper ────────────────────────────────────── */}
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1.5">
            {t("bookings.guests")}
          </label>
          <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
              className="px-4 py-3 text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >−</button>
            <span className="flex-1 text-center text-sm font-bold text-[var(--text-primary)]">
              {guestsCount} {guestsCount === 1 ? t("person") : t("people")}
            </span>
            <button
              type="button"
              onClick={() => setGuestsCount(Math.min(selectedRoomObj?.capacity ?? 10, guestsCount + 1))}
              className="px-4 py-3 text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >+</button>
          </div>
        </div>

        {/* ── Room type selector ────────────────────────────────── */}
        {roomTypes.length > 0 && (
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">
              {t("bookings.roomType")}
            </label>
            <div className="space-y-2">
              {roomTypes.map(rt => {
                const isSelected = selectedRoom === rt.id;
                return (
                  <div
                    key={rt.id}
                    onClick={() => setSelectedRoom(rt.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--gold)] bg-[var(--gold-lighter)] shadow-[0_0_0_1px_var(--gold)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--gold)]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--border)]"}`}>
                        {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{rt.name}</p>
                        <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5">
                          {rt.capacity} {rt.capacity === 1 ? t("person") : t("people")} max
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-black text-[var(--text-primary)]">${parseFloat(rt.pricePerNight).toLocaleString()}</p>
                      <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{t("common.perNight")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Extras ────────────────────────────────────────────── */}
        {availExtras.length > 0 && (
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">
              {t("bookings.exclusiveServices")}
            </label>
            <div className="space-y-2">
              {availExtras.map(s => {
                const checked = selectedExtras.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleExtra(s.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      checked
                        ? "border-[var(--text-primary)] bg-[var(--surface-hover)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]/40 hover:bg-white"
                    }`}
                  >
                    <span className="text-lg shrink-0">{EXTRA_ICONS[s.category] ?? "✨"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{s.name}</p>
                    </div>
                    <p className="text-xs font-black text-[var(--text-primary)] shrink-0">+${parseFloat(s.price).toLocaleString()}</p>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? "bg-[var(--text-primary)] border-[var(--text-primary)]" : "border-[var(--border)]"}`}>
                      {checked && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Special requests ──────────────────────────────────── */}
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1.5">
            {t("bookings.specialRequests")} <span className="normal-case font-normal">({t("optional")})</span>
          </label>
          <textarea
            value={specialRequests}
            onChange={e => setSpecialRequests(e.target.value)}
            rows={2}
            placeholder={t("bookings.specialRequestsPlaceholder")}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)] focus:bg-white transition-all resize-none leading-relaxed"
          />
        </div>

        {/* ── Price summary ─────────────────────────────────────── */}
        {nights > 0 && selectedRoom && (
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[var(--text-muted)]">{selectedRoomObj?.name} × {nights} {nights === 1 ? t("night") : t("nights")}</span>
              <span className="font-bold text-[var(--text-primary)]">${roomTotal.toLocaleString()}</span>
            </div>
            {extrasTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[var(--text-muted)]">{t("bookings.exclusiveServices")} ({selectedExtras.size})</span>
                <span className="font-bold text-[var(--text-primary)]">+${extrasTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-[var(--border-soft)]">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("bookings.totalToPay")}</span>
              <span className="text-2xl font-black text-[var(--text-primary)]">${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* ── Login prompt ──────────────────────────────────────── */}
        {!isLoggedIn && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
            <span className="text-amber-500 text-base shrink-0 mt-0.5">⚠</span>
            <div>
              <p className="text-xs font-bold text-amber-800">{t("bookings.accountRequired")}</p>
              <a href={`/${locale}/auth/login`} className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 font-semibold mt-0.5 inline-block">
                {t("bookings.loginOrRegister")} →
              </a>
            </div>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────────────────── */}
        <button
          onClick={handleBook}
          disabled={booking || !isReady}
          className={`w-full rounded-2xl py-4 text-[12px] font-bold tracking-[0.12em] uppercase transition-all duration-300 ${
            isReady && !booking
              ? "btn-gold"
              : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60"
          }`}
        >
          {booking
            ? t("bookings.processing")
            : !isReady
              ? t("bookings.completeFields")
              : isLoggedIn
                ? t("bookings.confirmReservation")
                : t("bookings.loginToBook")}
        </button>

        <p className="text-[11px] font-medium text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {t("bookings.noAdditionalCharges")}
        </p>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--border-soft)]">
          {[
            { icon: "🔒", label: "Pago seguro" },
            { icon: "✅", label: "Sin cargos ocultos" },
            { icon: "⭐", label: "Mejor precio" },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">{b.icon}</span>
              <span className="text-[9px] font-bold text-[var(--text-muted)] leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
