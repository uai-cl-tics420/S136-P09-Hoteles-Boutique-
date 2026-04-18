import { locales } from "@/i18n/i18n-util";
import type { Locales } from "@/i18n/i18n-types";
import { notFound } from "next/navigation";

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
  return <>{children}</>;
}