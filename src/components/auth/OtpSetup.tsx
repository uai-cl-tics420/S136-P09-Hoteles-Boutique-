// src/components/auth/OtpSetup.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

export function OtpSetup() {
  const [qrCode, setQrCode] = useState<string>("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    try {
      const res = await fetch("/api/auth/otp/setup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
      } else {
        toast.error("Error al iniciar la configuración");
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  const verifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        toast.success("Autenticación de dos factores activada");
        setQrCode(""); // Limpia el estado
      } else {
        toast.error("Código inválido. Intenta nuevamente.");
      }
    } catch (err) {
      toast.error("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-white max-w-md mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Autenticación de Dos Factores (2FA)</h3>
      <p className="text-sm text-gray-500 mb-4">Añade una capa extra de seguridad a tu cuenta usando una aplicación como Google Authenticator.</p>
      
      {!qrCode ? (
        <button onClick={startSetup} className="bg-gray-900 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          Configurar 2FA
        </button>
      ) : (
        <form onSubmit={verifySetup} className="space-y-4">
          <p className="text-sm font-medium text-gray-700">1. Escanea este código QR:</p>
          <div className="flex justify-center bg-white p-2 border rounded-lg">
            <Image src={qrCode} alt="QR Code" width={200} height={200} />
          </div>
          <p className="text-sm font-medium text-gray-700">2. Ingresa el código de 6 dígitos:</p>
          <input
            type="text"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full border border-gray-200 p-3 rounded-lg text-center tracking-widest text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button type="submit" disabled={token.length !== 6 || loading} className="w-full bg-green-600 text-white p-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
            {loading ? "Verificando..." : "Verificar y Activar"}
          </button>
        </form>
      )}
    </div>
  );
}