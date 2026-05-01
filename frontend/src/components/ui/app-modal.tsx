"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
};

export default function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  loading,
  error,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex min-w-0 shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            {subtitle && (
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
                {subtitle}
              </p>
            )}

            {title && (
              <h2 className="truncate text-base font-bold text-white sm:text-lg">
                {title}
              </h2>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Închide"
          >
            <X className="h-5 w-5 shrink-0" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
          {loading ? (
            <p className="text-sm text-slate-300">Se încarcă...</p>
          ) : error ? (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {error}
            </p>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}