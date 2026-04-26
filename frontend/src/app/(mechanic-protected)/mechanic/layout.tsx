"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import MechanicSidebar from "@/components/features/mechanic/navigation/mechanic-sidebar";
import { clearAllAuth } from "@/lib/auth";

type MechanicLayoutProps = {
  children: ReactNode;
};

export default function MechanicLayout({
  children,
}: MechanicLayoutProps) {
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
      mobileMenuLabel="Open mechanic sidebar"
      sidebar={
        <MechanicSidebar
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