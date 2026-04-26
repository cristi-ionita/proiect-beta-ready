"use client";

import type { ReactNode } from "react";

import MechanicGuard from "@/components/guards/mechanic-guard";

type MechanicProtectedLayoutProps = {
  children: ReactNode;
};

export default function MechanicProtectedLayout({
  children,
}: MechanicProtectedLayoutProps) {
  return <MechanicGuard>{children}</MechanicGuard>;
}