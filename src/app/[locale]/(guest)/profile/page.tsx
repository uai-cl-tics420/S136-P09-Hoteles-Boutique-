"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [showOtpSetup, setShowOtpSetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleGenerateOTP() {
    if (!session?.user?.email) {
      toast.error("No hay sesión activa");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      if (!res.ok) throw new Error("Error generando QR");
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowOtpSetup(true);
      toast.success("Seguridad activada. Escanea el código.");
    } catch (err) {
      toast.error("Error generando código de seguridad");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Código de seguridad inválido");
      }
      setShowOtpSetup(false);
      setVerifyToken("");
      setQrCode("");
      setSecret("");
      toast.success("✓ Verificación en dos pasos confirmada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error verificando código");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center gap-4">
          <a href="/es/hotels" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            ← Explorar hoteles
          </a>
          <span className="text-[var(--border)]">|</span>
          <span className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">Cuenta Personal</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-12 space-y-8 animate-slide-up">
        
        {/* Avatar + Info */}
        {session?.user && (
          <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)] p-8 flex items-center gap-6">
            <div className="relative flex-shrink-0">
              {session.user.image ? (
                <Image src={session.user.image} alt={session.user.name || "Usuario"} width={80} height={80} className="rounded-full ring-4 ring-[var(--gold)]/20 shadow-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-[var(--gold)] text-3xl font-black shadow-lg">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Sesión activa" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-[var(--text-primary)] truncate">{session.user.name || "Huésped Exclusivo"}</h1>
              <p className="text-sm font-medium text-[var(--text-muted)] truncate">{session.user.email}</p>
              <div className="mt-3 inline-block bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--border)]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">Miembro Premium</span>
              </div>
            </div>
          </div>
        )}

        {/* Menú de Acciones */}
        <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)] overflow-hidden">
          
          <a href="/es/bookings" className="flex items-center justify-between px-8 py-6 hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border-soft)] group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border)]">
                <span className="text-lg">🛎️</span>
              </div>
              <div>
                <span className="block text-base font-bold text-[var(--text-primary)]">Mis Reservas & Gustos</span>
                <span className="block text-xs font-medium text-[var(--text-muted)] mt-0.5">Gestiona tus estancias y preferencias de viaje</span>
              </div>
            </div>
            <span className="text-xl text-[var(--text-muted)] group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all">→</span>
          </a>

          {/* OTP Section */}
          <div className="px-8 py-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border)]">
                <span className="text-lg">🔐</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--text-primary)]">Seguridad Avanzada</span>
                  <span className="text-[9px] px-2 py-0.5 bg-[var(--gold)]/10 text-[var(--gold)] rounded-full font-black uppercase tracking-wider border border-[var(--gold)]/20">2FA</span>
                </div>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">Protege tu cuenta con verificación en dos pasos.</p>
              </div>
            </div>

            {!showOtpSetup ? (
              <button onClick={handleGenerateOTP} disabled={loading} className="w-full sm:w-auto inline-block bg-[var(--text-primary)] hover:bg-black disabled:opacity-50 text-white text-sm font-bold tracking-widest uppercase py-3 px-6 rounded-xl transition-all shadow-md">
                {loading ? "Generando..." : "Configurar Seguridad"}
              </button>
            ) : (
              <div className="mt-6 p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-inner">
                
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[var(--gold)] text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                    Escanea el Código
                  </p>
                  {qrCode && (
                    <div className="flex justify-center bg-white p-4 rounded-2xl border border-[var(--border-soft)] shadow-sm max-w-[200px] mx-auto">
                      <Image src={qrCode} alt="TOTP QR" width={160} height={160} />
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 text-center">O ingresa esta clave manual:</p>
                  <div className="bg-white border border-[var(--border)] p-3 rounded-xl font-mono text-xs text-center break-all text-[var(--text-primary)] select-all shadow-sm">{secret}</div>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[var(--gold)] text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                    Verifica el Código
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text" inputMode="numeric" value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6} autoFocus
                      className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl text-center text-2xl tracking-[0.5em] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[var(--gold)] bg-white shadow-sm"
                      placeholder="000000"
                    />
                    <button onClick={handleVerifyOTP} disabled={verifying || verifyToken.length !== 6} className="bg-[var(--gold)] hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-bold tracking-widest uppercase py-3 px-8 rounded-xl transition-all shadow-md">
                      {verifying ? "..." : "Activar"}
                    </button>
                  </div>
                </div>

                <button onClick={() => { setShowOtpSetup(false); setQrCode(""); setSecret(""); setVerifyToken(""); }} className="w-full text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest py-2 transition-colors">
                  Cancelar Configuración
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button onClick={() => signOut({ callbackUrl: "/es/auth/login" })} className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-red-100 text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Finalizar Sesión
        </button>
      </div>
    </main>
  );
}
