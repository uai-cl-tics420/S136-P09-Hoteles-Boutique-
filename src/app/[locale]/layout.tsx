import { locales } from "@/i18n/i18n-util";
import type { Locales } from "@/i18n/i18n-types";
import { notFound } from "next/navigation";

import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "../session-provider";
import "../globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locales)) notFound();
  
  return (
    <html lang={locale} className={`${outfit.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#fafafa] font-sans text-gray-900 antialiased selection:bg-gray-900 selection:text-white">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}