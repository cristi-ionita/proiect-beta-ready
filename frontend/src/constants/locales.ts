import type { Locale } from "@/lib/i18n/dictionaries";

export const LANGUAGE_OPTIONS: Array<{
  code: Locale;
  label: string;
  short: string;
}> = [
  { code: "ro", label: "Română", short: "RO" },
  { code: "en", label: "English", short: "EN" },
  { code: "de", label: "Deutsch", short: "DE" },
];

export const LANGUAGE_NAMES: Record<Locale, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
};