"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

function OtpSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempSessionId = searchParams.get("session") ?? "";

  const [step, setStep] = useState<"scan" | "verify">("scan");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  async function handleGenerateQr(e: React.FormEvent) {
    e.preventDefault();
    setLoadingQr(true);
    try {
      const res = await fetch("/api/auth/otp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Error generando QR");
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setEmailSubmitted(true);
      setStep("scan");
    } catch {
      toast.error("Error al generar el código QR");
    } finally {
      setLoadingQr(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoadingVerify(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tempSessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Código inválido. Intenta de nuevo.");
        setToken("");
        return;
      }

      toast.success("¡2FA configurado correctamente! Bienvenido.");
      router.push("/es/hotels");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoadingVerify(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-100 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-2xl mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900">Hoteles Boutique</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8">
          {/* Badge obligatorio */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-xs font-medium text-amber-700">
              La verificación en dos pasos es <strong>obligatoria</strong>
            </p>
          </div>

          <div className="w-14 h-14 bg-violet-50 border-2 border-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.75">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-stone-900 text-center mb-1">Configura tu 2FA</h2>
          <p className="text-sm text-stone-500 text-center mb-7">
            Necesitas una app autenticadora para continuar.<br />
            <span className="text-xs">Google Authenticator, Authy o Microsoft Authenticator</span>
          </p>

          {/* Paso 1: ingresar email si no se ha hecho */}
          {!emailSubmitted && (
            <form onSubmit={handleGenerateQr} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                  Tu correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-stone-50 focus:bg-white"
                  placeholder="tu@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loadingQr || !email}
                className="w-full bg-violet-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {loadingQr ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Generando QR...
                  </span>
                ) : "Generar código QR"}
              </button>
            </form>
          )}

          {/* Paso 2: mostrar QR y verificar */}
          {emailSubmitted && (
            <div className="space-y-5">
              {/* Instrucción 1 */}
              <div>
                <p className="text-xs font-semibold text-stone-600 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                  Escanea este código QR con tu app
                </p>
                {qrCode && (
                  <div className="flex justify-center bg-white p-3 rounded-xl border border-stone-200">
                    <Image src={qrCode} alt="TOTP QR" width={170} height={170} />
                  </div>
                )}
              </div>

              {/* Clave manual */}
              <div>
                <p className="text-xs text-stone-400 mb-1.5">¿Sin cámara? Ingresa la clave manualmente:</p>
                <div className="bg-stone-50 border border-dashed border-stone-300 p-2.5 rounded-lg font-mono text-xs text-center break-all text-stone-700 select-all">
                  {secret}
                </div>
              </div>

              {/* Instrucción 2 */}
              <form onSubmit={handleVerify} className="space-y-3">
                <p className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  Ingresa el código de 6 dígitos
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono border-2 border-stone-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500 transition-colors bg-stone-50 focus:bg-white"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={loadingVerify || token.length !== 6}
                  className="w-full bg-emerald-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loadingVerify ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Verificando...
                    </span>
                  ) : "Activar y continuar"}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Este paso es requerido para proteger tu cuenta.
        </p>
      </div>
    </main>
  );
}

export default function OtpSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-amber-50/40">
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Cargando...
        </div>
      </div>
    }>
      <OtpSetupForm />
    </Suspense>
  );
}
