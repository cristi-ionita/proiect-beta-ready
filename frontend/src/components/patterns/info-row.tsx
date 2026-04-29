import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InfoRowProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
};

export default function InfoRow({
  icon,
  label,
  value,
  className,
  valueClassName,
}: InfoRowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-300">
        <span className="text-slate-200">{icon}</span>
        <span>{label}</span>
      </div>

      <div
        className={cn(
          "mt-2 text-sm font-semibold text-white",
          valueClassName
        )}
      >
        {value}
      </div>
    </div>
  );
}