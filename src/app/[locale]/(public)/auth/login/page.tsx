"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/es/hotels";
  
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempSessionId, setTempSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Paso 1: Credenciales
  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Credenciales inválidas");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.requiresOtp) {
        // Usuario tiene OTP habilitado → mostrar pantalla de verificación
        setTempSessionId(data.tempSessionId);
        setStep('otp');
        toast.success("Introduce el código de tu app de autenticación");
      } else {
        // Login exitoso sin OTP
        toast.success("¡Bienvenido de vuelta!");
        router.push(callbackUrl);
      }
    } catch (err) {
      toast.error("Error en la autenticación");
      setError("Error en la autenticación");
    } finally {
      setLoading(false);
    }
  }

  // Paso 2: Verificación OTP
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

      // OTP verificado → emitir JWT (ES256) + Refresh Token (SHA-256)
      toast.success("¡Autenticación exitosa!");
      router.push(callbackUrl);
    } catch (err) {
      toast.error("Error verificando OTP");
      setError("Error verificando OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-8">Bienvenido a Hoteles Boutique</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* PASO 1: CREDENCIALES */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                placeholder="tu@email.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                placeholder="Tu contraseña" 
              />

            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Autenticando..." : "Ingresar"}
            </button>
          </form>
        )}

        {/* PASO 2: VERIFICACIÓN OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700 font-medium">✓ Email verificado</p>
              <p className="text-xs text-blue-600 mt-1">Ingresa el código de tu app (Google Authenticator, Authy, etc.)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código OTP (6 dígitos)</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                maxLength={6}
                required 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-3xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow"
                placeholder="000000"
              />
              <p className="text-xs text-gray-400 mt-1">Código de autenticación temporal</p>
            </div>
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar Código OTP"}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setStep('credentials');
                setOtp('');
                setPassword('');
                setError('');
              }}
              className="w-full text-gray-600 hover:text-gray-800 text-sm py-2"
            >
              ← Volver atrás
            </button>
          </form>
        )}

        {/* Separador */}
        <div className="relative mt-6 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">O continúa con</span>
          </div>
        </div>

        {/* Botón SSO Google (OAuth 2.0 + OpenID Connect) */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google (SSO)
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{" "}
          <a href="/es/auth/register" className="text-gray-900 font-medium hover:underline">Regístrate</a>
        </p>
      </div>
    </main>
  );
}