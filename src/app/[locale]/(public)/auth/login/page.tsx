"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/es/hotels";

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempSessionId, setTempSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result?.ok) {
        setError("Correo o contraseña incorrectos");
        setLoading(false);
        return;
      }

      const checkRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await checkRes.json();

      if (data.requiresOtp) {
        // Usuario ya tiene OTP configurado → pedir código
        setTempSessionId(data.tempSessionId);
        setStep("otp");
      } else if (data.requiresOtpSetup) {
        // Usuario NO tiene OTP → redirigir a configurarlo (obligatorio)
        toast("Debes configurar la verificación en dos pasos para continuar", {
          description: "Es un requisito de seguridad obligatorio.",
          duration: 5000,
        });
        router.push(`/es/auth/otp-setup?session=${data.tempSessionId}`);
      } else {
        toast.success("¡Bienvenido de vuelta!");
        router.push(callbackUrl);
      }
    } catch {
      toast.error("Error en la autenticación");
      setError("Error en la autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp, tempSessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Código OTP inválido");
        setLoading(false);
        return;
      }

      toast.success("¡Autenticación exitosa!");
      router.push(callbackUrl);
    } catch {
      toast.error("Error verificando OTP");
      setError("Error verificando OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-2xl mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Hoteles Boutique</h1>
          <p className="text-sm text-stone-500 mt-1">Experiencias únicas, cada estadía</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 overflow-hidden">
          {/* Step indicator */}
          <div className="flex border-b border-stone-100">
            <div className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${step === "credentials" ? "text-stone-900 border-b-2 border-stone-900" : "text-stone-400"}`}>
              1. Credenciales
            </div>
            <div className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${step === "otp" ? "text-violet-700 border-b-2 border-violet-600" : "text-stone-300"}`}>
              2. Verificación 2FA
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* PASO 1: CREDENCIALES */}
            {step === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all bg-stone-50 focus:bg-white"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all bg-stone-50 focus:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Autenticando...
                    </span>
                  ) : "Ingresar"}
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-stone-400">O continúa con</span></div>
                </div>

                {/* Google con prompt=select_account para forzar selector de cuenta */}
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl, prompt: "select_account" })}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuar con Google
                </button>
              </form>
            )}

            {/* PASO 2: VERIFICACIÓN OTP */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl">
                  <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-violet-800">Credenciales verificadas</p>
                    <p className="text-xs text-violet-600 mt-0.5">Abre tu app autenticadora e ingresa el código de 6 dígitos</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-3 uppercase tracking-wide text-center">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-violet-500 transition-colors bg-stone-50 focus:bg-white"
                    placeholder="000000"
                  />
                  <p className="text-xs text-stone-400 text-center mt-2">El código se renueva cada 30 segundos</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-violet-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Verificando...
                    </span>
                  ) : "Verificar código"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setOtp(""); setPassword(""); setError(""); }}
                  className="w-full text-stone-400 hover:text-stone-600 text-sm py-2 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  Volver atrás
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          ¿No tienes cuenta?{" "}
          <a href="/es/auth/register" className="text-stone-900 font-semibold hover:underline">Regístrate</a>
        </p>
      </div>
    </main>
  );
}
