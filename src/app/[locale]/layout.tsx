import { locales } from "@/i18n/i18n-util";
import type { Locales } from "@/i18n/i18n-types";
import { notFound } from "next/navigation";

import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "../session-provider";
import "../globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
      <head>
        <meta name="theme-color" content="#FAF9F6" />
      </head>
      <body className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: "600",
              fontSize: "13px",
              borderRadius: "16px",
            },
          }}
        />
      </body>
    </html>
  );
}