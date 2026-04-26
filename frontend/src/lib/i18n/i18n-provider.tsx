"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  defaultLocale,
  getCurrentLocale,
  getTranslation,
  isLocale,
  locales,
  setStoredLocale,
  type Locale,
  type TranslationNamespace,
} from "./index";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (namespace: TranslationNamespace, key: string) => string;
  locales: readonly Locale[];
};

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  /**
   * CRITICAL:
   * - server render = defaultLocale
   * - client hydration = SAME VALUE
   */
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  /**
   * After hydration → sync with real stored/browser locale
   */
  useEffect(() => {
    const realLocale = getCurrentLocale();

    if (realLocale !== locale) {
      setLocaleState(realLocale);
    }
  }, []);

  /**
   * Persist + update <html lang="">
   */
  useEffect(() => {
    document.documentElement.lang = locale;
    setStoredLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!isLocale(nextLocale)) {
      return;
    }

    setLocaleState(nextLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      locales,
      t: (namespace, key) => getTranslation(locale, namespace, key as never),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18nContext must be used within I18nProvider");
  }

  return context;
}