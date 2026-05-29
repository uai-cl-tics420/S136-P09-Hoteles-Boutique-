import { auth } from "@/lib/auth/nextauth.config";
import { redirect } from "next/navigation";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"] as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  // Segunda línea de defensa: verificar rol en servidor
  if (!session?.user || !ADMIN_ROLES.includes((session.user as any).role)) {
    redirect(`/${locale}/403`);
  }

  const userName =
    session.user.name || session.user.email?.split("@")[0] || "Admin";
  const userRole = (session.user as any).role as string;

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar Premium */}
      <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col py-8 px-5 gap-2 fixed h-full z-10 shadow-[var(--shadow-xs)]">
        <div className="mb-8 px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1">
            Hoteles Boutique
          </p>
          <a
            href={`/${locale}/admin`}
            className="text-xl font-black text-[var(--text-primary)] tracking-tight hover:text-[var(--gold)] transition-colors"
          >
            Portal Admin
          </a>
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          {[
            { href: `/${locale}/admin`, label: "Dashboard", icon: "📊" },
            { href: `/${locale}/admin/hotels`, label: "Propiedades", icon: "🏨" },
            { href: `/${locale}/admin/settings`, label: "Configuración", icon: "⚙️" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl px-4 py-3 transition-all group"
            >
              <span className="text-lg opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                {link.icon}
              </span>
              {link.label}
            </a>
          ))}
        </div>

        {/* User info + role badge */}
        <div className="pt-4 border-t border-[var(--border-soft)] flex flex-col gap-2">
          <div className="px-4 py-3 bg-[var(--surface-hover)] rounded-xl">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {userName}
            </p>
            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
              {userRole === "SUPER_ADMIN" ? "Super Admin" : "Hotel Admin"}
            </span>
          </div>
          <a
            href={`/${locale}/hotels`}
            className="flex items-center gap-3 text-sm font-bold text-[var(--gold)] hover:text-yellow-600 rounded-xl px-4 py-3 transition-all hover:bg-[var(--gold)]/10"
          >
            <span className="text-lg">↗</span>
            Ver Sitio Público
          </a>
        </div>
      </aside>

      {/* Content Area */}
      <main className="ml-64 flex-1 p-10 lg:p-12 animate-fade-in">
        {children}
      </main>
    </div>
  );
}