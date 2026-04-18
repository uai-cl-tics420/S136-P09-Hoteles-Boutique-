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
      toast.success("QR generado. Escanea con tu app de autenticación.");
    } catch (err) {
      toast.error("Error generando código QR");
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
        throw new Error(data.error || "Código OTP inválido");
      }
      setShowOtpSetup(false);
      setVerifyToken("");
      setQrCode("");
      setSecret("");
      toast.success("✓ Autenticación en dos pasos activada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error verificando OTP");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/es/hotels" className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Hoteles
          </a>
          <span className="text-stone-300">/</span>
          <span className="text-sm font-medium text-stone-800">Mi perfil</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Avatar + Info */}
        {session?.user && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name || "Usuario"} width={64} height={64} className="rounded-full ring-2 ring-amber-100" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-semibold">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-stone-900 truncate">{session.user.name || "Usuario"}</p>
                <p className="text-sm text-stone-500 truncate">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menú */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <a href="/es/bookings" className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors border-b border-stone-50 group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="text-sm font-medium text-stone-800">Mis reservas</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" className="group-hover:translate-x-0.5 transition-transform">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>

          {/* OTP Section */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-800">Autenticación en dos pasos</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">2FA</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">Compatible con Google Authenticator, Authy y similares.</p>
              </div>
            </div>

            {!showOtpSetup ? (
              <button onClick={handleGenerateOTP} disabled={loading} className="text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                {loading ? "Generando..." : "Configurar 2FA"}
              </button>
            ) : (
              <div className="mt-3 space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                <div>
                  <p className="text-xs font-semibold text-stone-600 mb-2 flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    Escanea el código QR con tu app
                  </p>
                  {qrCode && (
                    <div className="flex justify-center bg-white p-3 rounded-xl border border-stone-200">
                      <Image src={qrCode} alt="TOTP QR" width={160} height={160} />
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-stone-500 mb-1.5">O ingresa la clave manualmente:</p>
                  <div className="bg-white border border-dashed border-stone-300 p-2.5 rounded-lg font-mono text-xs text-center break-all text-stone-700 select-all">{secret}</div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone-600 mb-2 flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    Ingresa el código de 6 dígitos
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text" inputMode="numeric" value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6} autoFocus
                      className="flex-1 px-3 py-2.5 border border-stone-200 rounded-lg text-center text-xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      placeholder="000000"
                    />
                    <button onClick={handleVerifyOTP} disabled={verifying || verifyToken.length !== 6} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
                      {verifying ? "..." : "Activar"}
                    </button>
                  </div>
                </div>

                <button onClick={() => { setShowOtpSetup(false); setQrCode(""); setSecret(""); setVerifyToken(""); }} className="w-full text-xs text-stone-400 hover:text-stone-600 py-1.5 transition-colors">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button onClick={() => signOut({ callbackUrl: "/es/auth/login" })} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-2xl border border-red-100 text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
