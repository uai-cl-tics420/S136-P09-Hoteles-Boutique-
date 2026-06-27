import { auth } from "@/lib/auth/nextauth.config";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

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

  if (!session?.user || !ADMIN_ROLES.includes((session.user as any).role)) {
    redirect(`/${locale}/403`);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Responsive sidebar — handles mobile hamburger & desktop fixed */}
      <AdminSidebar locale={locale} />

      {/* Content Area — offset for desktop sidebar */}
      <main className="flex-1 lg:ml-64 p-5 pt-16 sm:p-8 sm:pt-20 lg:p-10 lg:pt-10 animate-fade-in min-w-0">
        {children}
      </main>
    </div>
  );
}