import type { Locale } from "@/lib/i18n/dictionaries";

export const LANGUAGE_OPTIONS = [
  { code: "ro", label: "Română", short: "RO" },
  { code: "en", label: "English", short: "EN" },
  { code: "de", label: "Deutsch", short: "DE" },
] as const satisfies readonly {
  code: Locale;
  label: string;
  short: string;
}[];

export const LANGUAGE_NAMES: Record<Locale, string> =
  Object.fromEntries(
    LANGUAGE_OPTIONS.map((l) => [l.code, l.label])
  ) as Record<Locale, string>;