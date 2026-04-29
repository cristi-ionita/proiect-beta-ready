"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AdminSidebar from "@/components/features/admin/navigation/admin-sidebar";
import AppShell from "@/components/layout/app-shell";
import { clearAllAuth } from "@/lib/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const from = searchParams.get("from");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, from]);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setSidebarOpen(false);
    clearAllAuth();
    router.replace("/?sessionExpired=1");
  }, [router]);

  return (
    <AppShell
      onOpenSidebar={openSidebar}
      sidebar={
        <AdminSidebar
          pathname={pathname}
          from={from}
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