"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

const baseStyles =
  "rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md";

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(baseStyles, className)}>
      {icon && (
        <div className="mb-3 flex justify-center text-white">
          {icon}
        </div>
      )}

      <p className="text-sm font-semibold text-white">{title}</p>

      {description && (
        <p className="mt-1 text-sm text-slate-300">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}