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
      if (!res.ok) { toast.error(data.error ?? "Código inválido"); setToken(""); return; }
      toast.success("Verificación exitosa");
      router.push("/es/hotels");
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Verificación en dos pasos</h1>
        <p className="text-sm text-gray-500 mb-8">Ingresa el código de 6 dígitos de tu app autenticadora</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
            value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
            required autoFocus
            className="w-full text-center text-2xl tracking-widest border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="000000" />
          <button type="submit" disabled={loading || token.length !== 6}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? "Verificando..." : "Verificar código"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6">El código se renueva cada 30 segundos</p>
      </div>
    </main>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Cargando...</p></div>}>
      <OtpForm />
    </Suspense>
  );
}