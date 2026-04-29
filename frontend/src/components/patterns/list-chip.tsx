import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ListChipVariant = "default" | "blue" | "emerald" | "amber" | "rose";

type ListChipProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ListChipVariant;
  className?: string;
};

const variants: Record<ListChipVariant, string> = {
  default: "border-white/10 bg-white/10 text-slate-200",
  blue: "border-blue-200/30 bg-blue-400/20 text-blue-100",
  emerald: "border-emerald-200/30 bg-emerald-400/20 text-emerald-100",
  amber: "border-amber-200/30 bg-amber-400/20 text-amber-100",
  rose: "border-rose-200/30 bg-rose-400/20 text-rose-100",
};

export default function ListChip({
  children,
  icon,
  variant = "default",
  className,
}: ListChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium",
        variants[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}