"use client";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <a href="/es/hotels" className="text-sm text-gray-500 hover:text-gray-900">← Hoteles</a>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Mi perfil</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <a href="/es/bookings" className="flex items-center justify-between py-3 border-b border-gray-50 hover:text-gray-600 transition-colors">
            <span className="text-sm font-medium text-gray-900">Mis reservas</span>
            <span className="text-gray-400">→</span>
          </a>
          <a href="/es/auth/otp" className="flex items-center justify-between py-3 border-b border-gray-50 hover:text-gray-600 transition-colors">
            <span className="text-sm font-medium text-gray-900">Configurar autenticación en dos pasos</span>
            <span className="text-gray-400">→</span>
          </a>
          <button onClick={() => signOut({ callbackUrl: "/es/auth/login" })}
            className="w-full text-left py-3 text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}