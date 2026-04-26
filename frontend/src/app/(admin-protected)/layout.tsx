"use client";

import type { ReactNode } from "react";

import AdminGuard from "@/components/guards/admin-guard";

type AdminProtectedLayoutProps = {
  children: ReactNode;
};

export default function AdminProtectedLayout({
  children,
}: AdminProtectedLayoutProps) {
  return <AdminGuard>{children}</AdminGuard>;
}