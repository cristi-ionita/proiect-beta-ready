"use client";

import { useContext } from "react";

import { I18nContext } from "./i18n-provider";
import {
  getTranslation,
  type TranslationKey,
  type TranslationNamespace,
} from "@/lib/i18n/dictionaries";

export function useI18n() {
  const context = useContext(I18nContext);

  if (context === null) {
    throw new Error("useI18n must be used within an <I18nProvider />");
  }

  const { locale, setLocale } = context;

  function t<N extends TranslationNamespace, K extends TranslationKey<N>>(
    namespace: N,
    key: K
  ) {
    return getTranslation(locale, namespace, key);
  }

  return {
    locale,
    setLocale,
    t,
  };
}