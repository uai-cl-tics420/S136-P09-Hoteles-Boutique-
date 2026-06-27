"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { loadTranslations } from "@/i18n/i18n-util";

// FIX: useSearchParams() debe estar en un componente hijo envuelto en <Suspense>
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";
  const locale = pathname.split("/")[1] || "es";
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/hotels`;
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

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
      if (!result || result.error) {
        setError(t("auth.loginError"));
        setLoading(false);
        return;
      }

      // Consultar si el usuario tiene OTP activo
      const checkRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await checkRes.json();

      if (data.requiresOtp) {
        setTempSessionId(data.tempSessionId);
        setStep("otp");
      } else {
        toast.success(t("auth.loginSuccess"));
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      toast.error(t("auth.loginError"));
      setError(t("auth.loginError"));
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
        setError(data.error || t("auth.otpInvalid"));
        setLoading(false);
        return;
      }

      toast.success(t("auth.loginSuccess"));
      router.refresh();
      router.push(callbackUrl);
    } catch {
      toast.error(t("auth.otpInvalid"));
      setError(t("auth.otpInvalid"));
    } finally {
      setLoading(false);
    }
  }

  if (!t) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] animate-shimmer" />
    </div>
  );

  return (
    <main className="min-h-screen flex bg-[var(--background)] overflow-hidden">

      {/* ── Left Panel: Decorative ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative aurora-bg noise items-center justify-center">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-[var(--gold)]/10 blur-[100px] animate-orb" />
          <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-purple-500/10 blur-[80px] animate-orb" style={{ animationDelay: "2s" }} />
        </div>

        {/* Spinning ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full border border-white/5 animate-spin-slow" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center px-8">
          {/* Logo */}
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center mx-auto mb-8 animate-glow-ring">
            <span className="text-3xl font-black text-[var(--gold-shine)]">HB</span>
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight animate-text-reveal">
            Hoteles<br/>
            <span className="text-[var(--gold-shine)]">Boutique</span>
          </h2>

          <p className="text-white/40 text-sm leading-relaxed mb-10 animate-text-reveal-d1">
            Plataforma integral para la gestión y descubrimiento de hoteles boutique en Latinoamérica.
          </p>

          {/* Floating particles */}
          <div className="absolute top-[12%] left-[20%] w-2 h-2 rounded-full bg-[var(--gold)]/30 animate-particle" />
          <div className="absolute top-[65%] right-[15%] w-1.5 h-1.5 rounded-full bg-white/20 animate-particle-d1" />
          <div className="absolute bottom-[15%] left-[30%] w-1 h-1 rounded-full bg-purple-400/30 animate-particle-d2" />

          {/* Tech badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 animate-text-reveal-d2">
            {[
              { label: "Next.js 15", color: "border-white/15 text-white/50" },
              { label: "Bun", color: "border-amber-500/30 text-amber-300/60" },
              { label: "PostgreSQL", color: "border-blue-400/25 text-blue-300/60" },
              { label: "Gemini AI", color: "border-purple-400/25 text-purple-300/60" },
            ].map(b => (
              <span key={b.label} className={`text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${b.color}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--text-primary)] rounded-2xl mb-4">
              <span className="text-lg font-black text-[var(--gold-shine)]">HB</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Hoteles<span className="text-[var(--gold)]">Boutique</span>
            </h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">
              {step === "credentials" ? t("auth.login") : t("auth.otpTitle")}
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-medium">
              {step === "credentials"
                ? "Ingresa tus credenciales para acceder a la plataforma."
                : "Ingresa el código de tu aplicación de autenticación."
              }
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              step === "credentials"
                ? "bg-gradient-to-r from-[var(--gold-shine)] to-[var(--gold)]"
                : "bg-[var(--gold)]/20"
            }`} />
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              step === "otp"
                ? "bg-gradient-to-r from-purple-500 to-violet-600"
                : "bg-[var(--border)]"
            }`} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm font-medium animate-scale-in">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              {error}
            </div>
          )}

          {/* ── Credentials Form ──────────────────────────────── */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                  {t("auth.email")}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all bg-[var(--surface-2)] focus:bg-white placeholder:text-[var(--text-muted)]/50"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                  {t("auth.password")}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-[var(--border)] rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all bg-[var(--surface-2)] focus:bg-white placeholder:text-[var(--text-muted)]/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold rounded-2xl py-4 text-[12px] font-black tracking-[0.1em] uppercase disabled:opacity-50 mt-1 group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    {t("loading")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t("auth.login")}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-[var(--background)] px-4 text-[var(--text-muted)] font-bold uppercase tracking-widest">
                    o continúa con
                  </span>
                </div>
              </div>

              {/* Google sign-in */}
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl, prompt: "select_account" })}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-white py-3.5 text-sm font-bold text-[var(--text-primary)] transition-all hover:border-[var(--gold)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] group"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t("auth.loginWithGoogle")}
              </button>
            </form>
          )}

          {/* ── OTP Form ────────────────────────────────────── */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-800">{t("auth.otpTitle")}</p>
                  <p className="text-[11px] text-purple-600 mt-0.5">{t("auth.otpDescription")}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest text-center">
                  {t("auth.otpCode")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full border-2 border-[var(--border)] rounded-2xl px-4 py-5 text-center text-3xl tracking-[0.5em] font-mono font-bold focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all bg-[var(--surface-2)] focus:bg-white"
                  placeholder="000000"
                />
                <p className="text-[10px] text-[var(--text-muted)] text-center mt-2 font-medium">El código se renueva cada 30 segundos</p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl py-4 text-[12px] font-black tracking-[0.1em] uppercase hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    {t("loading")}
                  </span>
                ) : t("auth.otpVerify")}
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtp(""); setPassword(""); setError(""); }}
                className="w-full text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm py-2 flex items-center justify-center gap-1.5 transition-colors font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                {t("back")}
              </button>
            </form>
          )}

          {/* Register link */}
          <p className="text-center text-sm text-[var(--text-muted)] mt-8 font-medium">
            {t("auth.noAccount")}{" "}
            <a href={`/${locale}/auth/register`} className="text-[var(--gold-dark)] font-bold hover:text-[var(--gold)] transition-colors">
              {t("auth.register")}
            </a>
          </p>

          {/* Footer */}
          <p className="text-center text-[10px] text-[var(--text-muted)]/50 mt-10 font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} HotelesBoutique · TICS420
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] animate-shimmer mx-auto" />
          <div className="w-32 h-3 rounded-full bg-[var(--surface-2)] animate-shimmer mx-auto" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
