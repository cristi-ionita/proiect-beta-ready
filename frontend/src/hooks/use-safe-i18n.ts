"use client";

import { useI18nContext } from "@/lib/i18n/i18n-provider";
import type {
  TranslationKey,
  TranslationNamespace,
} from "@/lib/i18n/dictionaries";

function mapLocaleToTag(locale: "ro" | "en" | "de") {
  switch (locale) {
    case "ro":
      return "ro-RO";
    case "en":
      return "en-US";
    case "de":
      return "de-DE";
  }
}

export function useSafeI18n() {
  const context = useI18nContext();

  function t<N extends TranslationNamespace, K extends TranslationKey<N>>(
    namespace: N,
    key: K
  ): string {
    return context.t(namespace, String(key));
  }

  return {
    locale: context.locale,
    localeTag: mapLocaleToTag(context.locale),
    setLocale: context.setLocale,
    locales: context.locales,
    t,
  };
}