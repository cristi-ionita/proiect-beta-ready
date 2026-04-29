"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { clearAllAuth, getAdminToken, getAppToken } from "@/lib/auth";

const IDLE_LIMIT_MS = 15 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

function hasAnyToken(): boolean {
  return Boolean(getAdminToken() || getAppToken());
}

export function useSessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoutExpiredSession = useCallback(() => {
    clearAllAuth();
    router.replace("/?sessionExpired=1");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (!hasAnyToken()) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(logoutExpiredSession, IDLE_LIMIT_MS);
  }, [logoutExpiredSession]);

  useEffect(() => {
    if (!hasAnyToken()) return;

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
}