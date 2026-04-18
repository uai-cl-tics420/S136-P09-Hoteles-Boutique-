export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1 fixed h-full z-10">
        <a href="/es/admin" className="text-base font-semibold text-gray-900 mb-6 px-2">Panel Admin</a>
        {[
          { href: "/es/admin", label: "Dashboard" },
          { href: "/es/admin/hotels", label: "Mis hoteles" },
          { href: "/es/admin/settings", label: "Configuración" },
          { href: "/es/hotels", label: "← Ver sitio" },
        ].map(link => (
          <a key={link.href} href={link.href}
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
            {link.label}
          </a>
        ))}
      </aside>
      {/* Content */}
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}