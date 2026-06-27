"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebarToggle({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: `/${locale}/admin`,          label: "Dashboard",      icon: "📊" },
    { href: `/${locale}/admin/analytics`, label: "Analytics",     icon: "📈" },
    { href: `/${locale}/admin/hotels`,    label: "Propiedades",   icon: "🏨" },
    { href: `/${locale}/admin/settings`,  label: "Configuración", icon: "⚙️" },
  ];

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-[var(--border)] rounded-xl shadow-md flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {open ? <path d="M18 6 6 18M6 6l12 12"/> : <><path d="M4 6h16M4 12h16M4 18h16"/></>}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[var(--surface)] border-r border-[var(--border)]
        flex flex-col py-8 px-5 gap-2 z-40 shadow-[var(--shadow-xs)]
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        <div className="mb-8 px-3">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-1 hover:text-yellow-400 transition-colors cursor-pointer"
            onClick={() => setOpen(false)}
          >
            Hoteles Boutique
          </Link>
          <a
            href={`/${locale}/admin`}
            className="text-xl font-black text-[var(--text-primary)] tracking-tight hover:text-[var(--gold)] transition-colors"
            onClick={() => setOpen(false)}
          >
            Portal Admin
          </a>
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/${locale}/admin` && pathname.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 text-sm font-bold rounded-xl px-4 py-3 transition-all group ${
                  isActive
                    ? "bg-[var(--gold)]/10 text-[var(--gold-dark)] border border-[var(--gold)]/20"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <span className="text-lg opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                  {link.icon}
                </span>
                {link.label}
              </a>
            );
          })}
        </div>

        {/* View public site */}
        <div className="pt-4 border-t border-[var(--border-soft)]">
          <a
            href={`/${locale}/hotels`}
            className="flex items-center gap-3 text-sm font-bold text-[var(--gold)] hover:text-yellow-600 rounded-xl px-4 py-3 transition-all hover:bg-[var(--gold)]/10"
            onClick={() => setOpen(false)}
          >
            <span className="text-lg">↗</span>
            Ver Sitio Público
          </a>
        </div>
      </aside>
    </>
  );
}
