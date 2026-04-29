"use client";

import type { ReactNode } from "react";

import AdminGuard from "@/components/guards/admin-guard";
import { useSessionTimeout } from "@/hooks/auth/use-session-timeout";

type AdminProtectedLayoutProps = {
  children: ReactNode;
};

export default function AdminProtectedLayout({
  children,
}: AdminProtectedLayoutProps) {
  useSessionTimeout();

  return <AdminGuard>{children}</AdminGuard>;
}