"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { LANGUAGE_OPTIONS } from "@/constants/locales";
import type { Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/use-i18n";

type LanguageSwitcherProps = {
  className?: string;
  align?: "left" | "right";
  variant?: "light" | "dark";
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function LanguageSwitcher({
  className,
  align = "right",
  variant = "light",
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const activeLanguage =
    LANGUAGE_OPTIONS.find((language) => language.code === locale) ??
    LANGUAGE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelectLanguage(code: Locale) {
    setLocale(code);
    setOpen(false);
  }

  const triggerClasses =
    variant === "dark"
      ? "inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
      : "inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300";

  const iconBoxClasses =
    variant === "dark"
      ? "flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-sm text-white"
      : "flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-700";

  const menuClasses =
    variant === "dark"
      ? "z-50 w-56 origin-top rounded-[24px] border border-white/10 bg-slate-900/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      : "z-50 w-56 origin-top rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur";

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Select language"
        className={triggerClasses}
      >
        <span className={iconBoxClasses}>
          <Globe className="h-4 w-4" />
        </span>

        <span className="hidden sm:block">{activeLanguage.label}</span>
        <span className="sm:hidden">{activeLanguage.short}</span>

        <ChevronDown
          className={cn(
            "h-4 w-4 transition",
            variant === "dark" ? "text-slate-300" : "text-slate-400",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        id={menuId}
        className={cn(
          "absolute top-[calc(100%+0.75rem)] transition-all duration-200",
          align === "right" ? "right-0" : "left-0",
          menuClasses,
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        )}
        role="menu"
        aria-label="Language selector"
      >
        {LANGUAGE_OPTIONS.map((language) => {
          const isActive = language.code === locale;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => handleSelectLanguage(language.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition",
                variant === "dark"
                  ? isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                  : isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
              role="menuitemradio"
              aria-checked={isActive}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold",
                    variant === "dark"
                      ? isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white/10 text-slate-200"
                      : isActive
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-600"
                  )}
                >
                  {language.short}
                </span>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{language.label}</span>
                  <span
                    className={cn(
                      "text-xs",
                      variant === "dark"
                        ? isActive
                          ? "text-slate-600"
                          : "text-slate-400"
                        : isActive
                          ? "text-slate-300"
                          : "text-slate-500"
                    )}
                  >
                    {language.code.toUpperCase()}
                  </span>
                </div>
              </div>

              {isActive ? <Check className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}