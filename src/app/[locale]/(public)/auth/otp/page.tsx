"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempSessionId = searchParams.get("session");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tempSessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Código inválido");
        setToken("");
        return;
      }
      toast.success("Verificación exitosa");
      router.push("/es/hotels");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
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

        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8 text-center">
          {/* Shield icon */}
          <div className="w-14 h-14 bg-violet-50 border-2 border-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.75">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-stone-900 mb-1">Verificación en dos pasos</h2>
          <p className="text-sm text-stone-500 mb-7">
            Ingresa el código de 6 dígitos de tu app autenticadora
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
              className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-stone-200 rounded-xl px-4 py-4 focus:outline-none focus:border-violet-500 transition-colors bg-stone-50 focus:bg-white"
              placeholder="000000"
            />
            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full bg-violet-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Verificando...
                </span>
              ) : "Verificar código"}
            </button>
          </form>

          <p className="text-xs text-stone-400 mt-5 flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            El código se renueva cada 30 segundos
          </p>
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          <a href="/es/auth/login" className="hover:text-stone-600 transition-colors flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </main>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-amber-50/40">
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Cargando...
        </div>
      </div>
    }>
      <OtpForm />
    </Suspense>
  );
}
