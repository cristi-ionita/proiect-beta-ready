"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import UserSidebar from "@/components/features/employee/navigation/user-sidebar";
import { clearAllAuth } from "@/lib/auth";

type EmployeeLayoutProps = {
  children: ReactNode;
};

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const openSidebar = useCallback((): void => {
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback((): void => {
    setSidebarOpen(false);
  }, []);

  const handleLogout = useCallback((): void => {
    setSidebarOpen(false);
    clearAllAuth();
    router.replace("/");
  }, [router]);

  return (
    <AppShell
      onOpenSidebar={openSidebar}
      sidebar={
        <UserSidebar
          pathname={pathname}
          open={sidebarOpen}
          onClose={closeSidebar}
          onLogout={handleLogout}
        />
      }
    >
      {children}
    </AppShell>
  );
}