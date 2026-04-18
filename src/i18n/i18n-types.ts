import type { BaseTranslation as BaseTranslationType, LocalizedString } from "typesafe-i18n";

export type BaseTranslation = BaseTranslationType;
export type Translation = BaseTranslationType;
export type Locales = "es" | "en";
export { LocalizedString };