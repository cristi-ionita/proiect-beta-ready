"use client";

import type { ReactNode } from "react";

type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info";
type StatusSize = "sm" | "md";

type StatusBadgeProps = {
  label: ReactNode;
  variant?: StatusVariant;
  size?: StatusSize;
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const variantClasses: Record<StatusVariant, string> = {
  success:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning:
    "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger:
    "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
  neutral:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  info:
    "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200",
};

const sizeClasses: Record<StatusSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export default function StatusBadge({
  label,
  variant = "neutral",
  size = "sm",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}