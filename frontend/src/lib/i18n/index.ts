import { getAdminToken, getSession } from "@/lib/auth";

export {
  dictionaries,
  defaultLocale,
  getTranslation,
  locales,
  type Locale,
  type TranslationKey,
  type TranslationNamespace,
} from "./dictionaries";

import { defaultLocale, type Locale } from "./dictionaries";

const GUEST_LOCALE_STORAGE_KEY = "lang:guest";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeRead(key: string): string | null {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ro" || value === "en" || value === "de";
}

function getScopedLocaleStorageKey(): string {
  if (!isBrowser()) return GUEST_LOCALE_STORAGE_KEY;

  const session = getSession();

  if (session?.unique_code) {
    return `lang:${session.role}:${session.unique_code}`;
  }

  if (getAdminToken()) {
    return "lang:admin";
  }

  return GUEST_LOCALE_STORAGE_KEY;
}

export function getStoredLocale(): Locale | null {
  const raw = safeRead(getScopedLocaleStorageKey());

  if (isLocale(raw)) {
    return raw;
  }

  const guestRaw = safeRead(GUEST_LOCALE_STORAGE_KEY);

  if (isLocale(guestRaw)) {
    return guestRaw;
  }

  return null;
}

export function setStoredLocale(locale: Locale): void {
  safeWrite(getScopedLocaleStorageKey(), locale);
  safeWrite(GUEST_LOCALE_STORAGE_KEY, locale);
}

export function getBrowserLocale(): Locale | null {
  if (!isBrowser()) return null;

  const browserLocale = window.navigator.language?.split("-")[0]?.toLowerCase();

  return isLocale(browserLocale) ? browserLocale : null;
}

export function getCurrentLocale(): Locale {
  return getStoredLocale() ?? getBrowserLocale() ?? defaultLocale;
}