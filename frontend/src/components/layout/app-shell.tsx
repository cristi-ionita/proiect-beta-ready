"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";

import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  sidebar: ReactNode;
  onOpenSidebar: () => void;
  mobileMenuLabel?: string;
  className?: string;
  contentClassName?: string;
};

export default function AppShell({
  children,
  sidebar,
  onOpenSidebar,
  mobileMenuLabel = "Open sidebar menu",
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      {sidebar}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-transparent md:hidden">
          <div className="px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenSidebar}
              aria-label={mobileMenuLabel}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6",
            contentClassName
          )}
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}