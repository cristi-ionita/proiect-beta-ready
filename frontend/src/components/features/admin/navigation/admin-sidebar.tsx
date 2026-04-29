"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CarFront,
  Check,
  ClipboardList,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";

import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { locales, type Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  pathname: string;
  from: string | null;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

const languageNames: Record<Locale, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
};

export default function AdminSidebar({
  pathname,
  from,
  open,
  onClose,
  onLogout,
}: Props) {
  const { locale, setLocale, t } = useSafeI18n();

  const [languageOpen, setLanguageOpen] = useState(false);
  const [pendingUsersCount] = useState(0);

  useEffect(() => {
    setLanguageOpen(false);
  }, [pathname, from]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLanguageOpen(false);
        if (open) onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const navigation: NavigationItem[] = useMemo(
    () => [
      {
        href: "/admin/dashboard",
        label: t("nav", "dashboard"),
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        href: "/admin/users",
        label: t("nav", "users"),
        icon: <Users className="h-5 w-5" />,
      },
      {
        href: "/admin/pending-users",
        label: t("nav", "pendingUsers"),
        icon: <UserCheck className="h-5 w-5" />,
        badge: pendingUsersCount > 0 ? pendingUsersCount : undefined,
      },
      {
        href: "/admin/vehicles",
        label: t("nav", "vehicles"),
        icon: <CarFront className="h-5 w-5" />,
      },
      {
        href: "/admin/issues",
        label: t("nav", "issues"),
        icon: <TriangleAlert className="h-5 w-5" />,
      },
      {
        href: "/admin/assignments",
        label: t("nav", "assignments"),
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        href: "/admin/documents",
        label: t("nav", "documents"),
        icon: <FileText className="h-5 w-5" />,
      },
      {
        href: "/admin/leave",
        label: t("nav", "leave"),
        icon: <CalendarDays className="h-5 w-5" />,
      },
    ],
    [pendingUsersCount, t]
  );

  function handleLanguageSelect(nextLocale: Locale) {
    setLocale(nextLocale);
    setLanguageOpen(false);
  }

  function isDashboardCardRoute() {
    return (
      from === "dashboard" &&
      [
        "/admin/active-users",
        "/admin/pending-users",
        "/admin/vehicles/unassigned",
        "/admin/issues",
        "/admin/leave/today",
      ].includes(pathname)
    );
  }

  function isDashboardActive() {
    return pathname === "/admin/dashboard" || isDashboardCardRoute();
  }

  function isItemActive(itemHref: string) {
    if (itemHref === "/admin/dashboard") {
      return isDashboardActive();
    }

    if (isDashboardCardRoute()) {
      return false;
    }

    return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          onClick={() => {
            setLanguageOpen(false);
            onClose();
          }}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[3px] md:hidden"
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[150px] transform border-r border-white/10",
          "bg-[radial-gradient(circle_at_top,#334155_0%,#1e293b_42%,#0f172a_100%)] text-white",
          "transition duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Admin sidebar"
      >
        <div className="flex h-full flex-col px-2 py-5">
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setLanguageOpen((current) => !current)}
              className="flex h-9 w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-md transition hover:bg-white/15"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label="Select language"
            >
              <span className="flex items-center gap-1.5 text-slate-100">
                <Globe className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {locale}
                </span>
              </span>
            </button>

            {languageOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl">
                {locales.map((item: Locale) => {
                  const isActive = locale === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleLanguageSelect(item)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium transition",
                        isActive
                          ? "bg-white text-slate-950"
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                      )}
                      aria-pressed={isActive}
                    >
                      <span>{languageNames[item]}</span>

                      {isActive ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <nav className="flex flex-1 flex-col items-center gap-2">
            {navigation.map((item) => {
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setLanguageOpen(false);
                    onClose();
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex w-full flex-col items-center justify-center gap-1.5 rounded-xl p-2.5 transition",
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.badge ? (
                    <span className="absolute right-2 top-2 min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                      {item.badge}
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition",
                      isActive
                        ? "bg-slate-950 text-white"
                        : "bg-black/30 text-slate-200"
                    )}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={cn(
                      "text-center text-[11px] font-medium leading-tight",
                      isActive ? "text-slate-950" : "text-inherit"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setLanguageOpen(false);
                onClose();
                onLogout();
              }}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <LogOut className="h-5 w-5" />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight">
                {t("common", "logout")}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}