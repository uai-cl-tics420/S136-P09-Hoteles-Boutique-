import type { Locales } from "./i18n-types";

export const locales: Locales[] = ["es", "en"];
export const defaultLocale: Locales = "es";

export async function loadTranslations(locale: Locales) {
  const { default: translations } = await import(`./${locale}/index`);
  return translations;
}

export function getLocaleFromPath(pathname: string): Locales {
  const segment = pathname.split("/")[1];
  if (locales.includes(segment as Locales)) {
    return segment as Locales;
  }
  return defaultLocale;
}