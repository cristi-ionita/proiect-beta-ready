"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

import Button from "@/components/ui/button";

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
  // 🔒 block scroll + ESC
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {subtitle && (
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {subtitle}
              </p>
            )}

            {title && (
              <h2 className="text-lg font-bold text-white">{title}</h2>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* States */}
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
  );
}