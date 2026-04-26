import type {
  AppSession,
  MechanicSession,
  UserSession,
} from "@/types/auth.types";
import type { UserRole } from "@/types/user.types";

type JwtPayload = {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
  type?: string;
};

const STORAGE_KEYS = {
  adminToken: "admin_token",
  appToken: "app_token",
  appSession: "app_session",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getStorage(): Storage | null {
  if (!isBrowser()) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStorage(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function removeStorage(key: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeToken(token: string): string | null {
  const normalized = token.trim();
  return normalized.length > 0 ? normalized : null;
}

function base64UrlDecode(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return window.atob(padded);
    }

    return null;
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) return null;

  try {
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

function isExpiredToken(token: string): boolean {
  const payload = parseJwtPayload(token);

  if (!payload || !isFiniteNumber(payload.exp)) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

function isValidRole(value: unknown): value is UserRole {
  return value === "admin" || value === "employee" || value === "mechanic";
}

function normalizeShiftNumber(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function isValidSession(value: unknown): value is AppSession {
  if (typeof value !== "object" || value === null) return false;

  const session = value as Partial<AppSession>;

  return (
    isFiniteNumber(session.user_id) &&
    isNonEmptyString(session.full_name) &&
    isNonEmptyString(session.unique_code) &&
    (session.shift_number === null || typeof session.shift_number === "string") &&
    isValidRole(session.role)
  );
}

function parseStoredJson<T>(
  key: string,
  validator: (value: unknown) => value is T
): T | null {
  const raw = readStorage(key);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!validator(parsed)) {
      removeStorage(key);
      return null;
    }

    return parsed;
  } catch {
    removeStorage(key);
    return null;
  }
}

function readValidToken(key: string): string | null {
  const raw = readStorage(key);
  if (!raw) return null;

  const normalized = normalizeToken(raw);
  if (!normalized) {
    removeStorage(key);
    return null;
  }

  if (isExpiredToken(normalized)) {
    removeStorage(key);
    return null;
  }

  return normalized;
}

export function saveAdminToken(token: string): void {
  const normalized = normalizeToken(token);

  if (!normalized) {
    removeStorage(STORAGE_KEYS.adminToken);
    return;
  }

  writeStorage(STORAGE_KEYS.adminToken, normalized);
}

export function getAdminToken(): string | null {
  return readValidToken(STORAGE_KEYS.adminToken);
}

export function clearAdminToken(): void {
  removeStorage(STORAGE_KEYS.adminToken);
}

export function hasActiveAdminSession(): boolean {
  return getAdminToken() !== null;
}

export function saveAppToken(token: string): void {
  const normalized = normalizeToken(token);

  if (!normalized) {
    removeStorage(STORAGE_KEYS.appToken);
    return;
  }

  writeStorage(STORAGE_KEYS.appToken, normalized);
}

export function getAppToken(): string | null {
  return readValidToken(STORAGE_KEYS.appToken);
}

export function clearAppToken(): void {
  removeStorage(STORAGE_KEYS.appToken);
}

export function hasActiveAppToken(): boolean {
  return getAppToken() !== null;
}

export function saveSession(session: AppSession): void {
  const normalizedSession: AppSession = {
    ...session,
    shift_number: normalizeShiftNumber(session.shift_number),
  };

  if (!isValidSession(normalizedSession)) return;

  writeStorage(STORAGE_KEYS.appSession, JSON.stringify(normalizedSession));
}

export function getSession(): AppSession | null {
  const session = parseStoredJson(STORAGE_KEYS.appSession, isValidSession);
  if (!session) return null;

  if (session.role === "admin" && !getAdminToken()) {
    clearSession();
    return null;
  }

  if (session.role !== "admin" && !getAppToken()) {
    clearSession();
    return null;
  }

  return session;
}

export function clearSession(): void {
  removeStorage(STORAGE_KEYS.appSession);
}

export function hasActiveSession(): boolean {
  return getSession() !== null;
}

export function saveUserSession(session: UserSession): void {
  saveSession({
    user_id: session.user_id,
    full_name: session.full_name,
    shift_number: normalizeShiftNumber(session.shift_number),
    unique_code: session.unique_code,
    role: "employee",
  });
}

export function getUserSession(): UserSession | null {
  const session = getSession();

  if (!session || session.role !== "employee") {
    return null;
  }

  return {
    user_id: session.user_id,
    full_name: session.full_name,
    shift_number: session.shift_number,
    unique_code: session.unique_code,
  };
}

export function clearUserSession(): void {
  clearAppToken();
  clearSession();
}

export function hasActiveUserSession(): boolean {
  return getUserSession() !== null;
}

export function saveMechanicSession(session: MechanicSession): void {
  saveSession({
    user_id: session.user_id,
    full_name: session.full_name,
    shift_number: null,
    unique_code: session.unique_code,
    role: "mechanic",
  });
}

export function getMechanicSession(): MechanicSession | null {
  const session = getSession();

  if (!session || session.role !== "mechanic") {
    return null;
  }

  return {
    user_id: session.user_id,
    full_name: session.full_name,
    unique_code: session.unique_code,
    role: "mechanic",
  };
}

export function clearMechanicSession(): void {
  clearAppToken();
  clearSession();
}

export function hasActiveMechanicSession(): boolean {
  return getMechanicSession() !== null;
}

export function clearAllAuth(): void {
  clearAdminToken();
  clearAppToken();
  clearSession();
}

export function clearAllSessions(): void {
  clearAllAuth();
}