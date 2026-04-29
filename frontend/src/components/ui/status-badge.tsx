"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info";
type StatusSize = "sm" | "md";

type StatusBadgeProps = {
  label: ReactNode;
  variant?: StatusVariant;
  size?: StatusSize;
  className?: string;
};

const variantClasses: Record<StatusVariant, string> = {
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  danger: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  neutral: "border-white/10 bg-white/10 text-slate-200",
  info: "border-blue-400/20 bg-blue-500/10 text-blue-200",
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
        "inline-flex items-center whitespace-nowrap rounded-full border font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}