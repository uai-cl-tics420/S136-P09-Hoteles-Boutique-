"use client";
import { signOut } from "next-auth/react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 mb-1">Idioma</p>
          <div className="flex gap-2">
            <a href="/es/admin/settings" className="px-4 py-2 rounded-xl border border-gray-900 bg-gray-900 text-white text-sm font-medium">Español</a>
            <a href="/en/admin/settings" className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">English</a>
          </div>
        </div>
        <div className="border-t border-gray-50 pt-4">
          <p className="text-sm font-medium text-gray-900 mb-1">Cuenta</p>
          <button onClick={() => signOut({ callbackUrl: "/es/auth/login" })}
            className="text-sm text-red-500 hover:text-red-700 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}