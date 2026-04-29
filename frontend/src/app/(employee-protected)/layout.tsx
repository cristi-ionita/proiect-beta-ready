"use client";

import { type ReactNode } from "react";

import UserGuard from "@/components/guards/user-guard";
import { useSessionTimeout } from "@/hooks/auth/use-session-timeout";

type EmployeeProtectedLayoutProps = {
  children: ReactNode;
};

export default function EmployeeProtectedLayout({
  children,
}: EmployeeProtectedLayoutProps) {
  useSessionTimeout();

  return <UserGuard>{children}</UserGuard>;
}