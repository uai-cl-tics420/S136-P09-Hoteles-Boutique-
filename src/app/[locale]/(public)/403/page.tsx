import Link from "next/link";

export const metadata = {
  title: "Acceso Denegado | Hoteles Boutique",
  description: "No tienes permisos para acceder a esta sección.",
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="text-center max-w-md animate-fade-in">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-3xl flex items-center justify-center shadow-[var(--shadow-xs)]">
          <span className="text-4xl">🔒</span>
        </div>

        {/* Error code */}
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--gold)] mb-3">
          Error 403
        </p>

        {/* Title */}
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight mb-4">
          Acceso Restringido
        </h1>

        {/* Description */}
        <p className="text-sm font-medium text-[var(--text-muted)] leading-relaxed mb-10">
          No tienes los permisos necesarios para acceder a esta sección.
          Si crees que esto es un error, contacta con el administrador de la plataforma.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/es/hotels"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gold)] text-white text-sm font-bold rounded-2xl hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shadow-md"
          >
            <span>←</span>
            Volver al inicio
          </Link>
          <Link
            href="/es/auth/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface)] text-[var(--text-primary)] text-sm font-bold rounded-2xl border border-[var(--border)] hover:border-[var(--gold)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Iniciar sesión con otra cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
