"use client";

import type { ReactNode } from "react";

import MechanicGuard from "@/components/guards/mechanic-guard";
import { useSessionTimeout } from "@/hooks/auth/use-session-timeout";

type MechanicProtectedLayoutProps = {
  children: ReactNode;
};

export default function MechanicProtectedLayout({
  children,
}: MechanicProtectedLayoutProps) {
  useSessionTimeout();

  return <MechanicGuard>{children}</MechanicGuard>;
}