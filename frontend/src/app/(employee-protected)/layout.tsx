"use client";

import { type ReactNode } from "react";

import UserGuard from "@/components/guards/user-guard";

type EmployeeProtectedLayoutProps = {
  children: ReactNode;
};

export default function EmployeeProtectedLayout({
  children,
}: EmployeeProtectedLayoutProps) {
  return <UserGuard>{children}</UserGuard>;
}