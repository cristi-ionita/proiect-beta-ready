"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  sidebar: ReactNode;
  onOpenSidebar: () => void;
  mobileMenuLabel?: string;
  className?: string;
  contentClassName?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AppShell({
  children,
  sidebar,
  onOpenSidebar,
  mobileMenuLabel = "Open sidebar menu",
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen bg-[radial-gradient(circle_at_top,#334155_0%,#1e293b_42%,#0f172a_100%)]",
        className
      )}
    >
      {sidebar}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-transparent md:hidden">
          <div className="px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label={mobileMenuLabel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all duration-200 hover:bg-white/14"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className={cn("min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6", contentClassName)}>
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}