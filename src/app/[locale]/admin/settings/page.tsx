"use client";
import { logoutAction } from "@/lib/auth/auth-actions";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Configuración del Sistema</h1>
        <p className="text-sm font-medium text-[var(--text-muted)] mt-2">Gestiona las preferencias de tu portal de administración.</p>
      </div>

      <div className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)] overflow-hidden">
        
        {/* Idioma */}
        <div className="p-8 border-b border-[var(--border-soft)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border)]">
              <span className="text-lg">🌐</span>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">Idioma de la Interfaz</p>
              <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">Selecciona el idioma principal del panel.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <a href="/es/admin/settings" className="px-6 py-3 rounded-xl border-2 border-[var(--text-primary)] bg-[var(--text-primary)] text-white text-sm font-bold uppercase tracking-widest shadow-md">Español</a>
            <a href="/en/admin/settings" className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all">English</a>
          </div>
        </div>

        {/* Cuenta */}
        <div className="p-8 bg-[var(--surface)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-[var(--border)]">
              <span className="text-lg">🛡️</span>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">Control de Sesión</p>
              <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">Finaliza tu sesión actual de forma segura.</p>
            </div>
          </div>

          <button onClick={() => logoutAction()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-red-200 text-sm font-bold uppercase tracking-widest text-red-500 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión Administrativa
          </button>
        </div>
      </div>
    </div>
  );
}