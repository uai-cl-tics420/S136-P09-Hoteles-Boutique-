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
  const [debugCode, setDebugCode] = useState("");
  const [loadingDebugCode, setLoadingDebugCode] = useState(false);

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
      setDebugCode("");
      toast.success("✓ OTP habilitado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error verificando OTP");
    } finally {
      setVerifying(false);
    }
  }

  async function handleGetDebugCode() {
    if (!session?.user?.email) {
      toast.error("No hay sesión activa");
      return;
    }

    setLoadingDebugCode(true);
    try {
      const res = await fetch(`/api/auth/otp/debug-code?email=${encodeURIComponent(session.user.email)}`);
      if (!res.ok) throw new Error("Error obteniendo código");
      
      const data = await res.json();
      setDebugCode(data.totpCode);
      setVerifyToken(data.totpCode);
      toast.success("Código TOTP copiado (válido 30 segundos)");
    } catch (err) {
      toast.error("Error obteniendo código de testing");
    } finally {
      setLoadingDebugCode(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <a href="/es/hotels" className="text-sm text-gray-500 hover:text-gray-900">← Hoteles</a>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Mi perfil</h1>

        {/* Información de usuario */}
        {session?.user && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menú */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <a href="/es/bookings" className="flex items-center justify-between py-3 border-b border-gray-50 hover:text-gray-600 transition-colors">
            <span className="text-sm font-medium text-gray-900">Mis reservas</span>
            <span className="text-gray-400">→</span>
          </a>

          {/* Configuración OTP */}
          <div className="py-3 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900">Autenticación en dos pasos (OTP)</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">RFC 6238</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              TOTP (Time-based One-Time Password) proporciona seguridad adicional. Compatible con Google Authenticator, Authy, Microsoft Authenticator.
            </p>
            {!showOtpSetup && (
              <button
                onClick={handleGenerateOTP}
                disabled={loading}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {loading ? "Generando..." : "Configurar OTP"}
              </button>
            )}

            {showOtpSetup && (
              <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                {/* QR */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">1. Escanea este código:</p>
                  {qrCode && (
                    <div className="flex justify-center">
                      <Image
                        src={qrCode}
                        alt="TOTP QR"
                        width={150}
                        height={150}
                        className="border border-gray-300"
                      />
                    </div>
                  )}
                </div>

                {/* Secret Manual */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">O ingresa manualmente:</p>
                  <div className="bg-white border border-dashed border-gray-300 p-2 rounded font-mono text-xs text-center break-all">
                    {secret}
                  </div>
                </div>

                {/* Verificación */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">2. Ingresa el código de 6 dígitos:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={verifyToken}
                      onChange={(e) =>
                        setVerifyToken(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      maxLength={6}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-blue-500"
                      placeholder="000000"
                    />
                    <button
                      onClick={handleVerifyOTP}
                      disabled={verifying || verifyToken.length !== 6}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded transition"
                    >
                      {verifying ? "..." : "OK"}
                    </button>
                  </div>
                </div>

                {/* Debug: Botón para obtener código */}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={handleGetDebugCode}
                    disabled={loadingDebugCode}
                    className="w-full text-xs bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-3 rounded transition"
                  >
                    {loadingDebugCode ? "Generando..." : "📱 Obtener código para testing"}
                  </button>
                  {debugCode && (
                    <p className="text-xs text-gray-600 mt-2 text-center font-mono">
                      Código: <span className="font-bold text-gray-900">{debugCode}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowOtpSetup(false);
                    setQrCode("");
                    setSecret("");
                    setVerifyToken("");
                  }}
                  className="w-full text-xs text-gray-600 hover:text-gray-800 py-2"
                >
                  Cancelar
                </button>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Abre tu app de autenticación para completar el código.
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/es/auth/login" })}
            className="w-full text-left py-3 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}