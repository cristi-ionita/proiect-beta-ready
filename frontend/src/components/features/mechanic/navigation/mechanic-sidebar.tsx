"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Globe, LayoutDashboard, LogOut } from "lucide-react";

import { locales, type Locale } from "@/lib/i18n/dictionaries";
import { useSafeI18n } from "@/hooks/use-safe-i18n";

type Props = {
  pathname: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const languageNames: Record<Locale, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
};

export default function MechanicSidebar({
  pathname,
  open,
  onClose,
  onLogout,
}: Props) {
  const { locale, setLocale, t } = useSafeI18n();
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    setLanguageOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLanguageOpen(false);

        if (open) {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const navigation: NavigationItem[] = [
    {
      href: "/mechanic/dashboard",
      label: t("nav", "dashboard"),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
  ];

  function handleLanguageSelect(nextLocale: Locale) {
    setLocale(nextLocale);
    setLanguageOpen(false);
  }

  function isItemActive(itemHref: string) {
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
          "shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition duration-300",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mechanic sidebar"
      >
        <div className="flex h-full flex-col px-2 py-5">
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setLanguageOpen((current) => !current)}
              className="flex h-9 w-full items-center justify-center rounded-xl border border-white/12 bg-white/8 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-200 hover:bg-white/12"
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
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                {locales.map((item) => {
                  const isActive = locale === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleLanguageSelect(item)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium transition-all duration-200",
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
                    "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl p-2.5 transition-all",
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
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
                onLogout();
              }}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 text-slate-300 transition-all hover:bg-white/10 hover:text-white"
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