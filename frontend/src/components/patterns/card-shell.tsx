import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardShellAccent = "blue" | "violet" | "rose" | "emerald" | "amber" | "slate";

type CardShellProps = {
  children: ReactNode;
  accent?: CardShellAccent;
  className?: string;
  innerClassName?: string;
};

const accentMap: Record<
  CardShellAccent,
  {
    glow: string;
    border: string;
    ring: string;
    tint: string;
  }
> = {
  blue: {
    glow: "bg-blue-300/24",
    border: "border-blue-200/24",
    ring: "group-hover:ring-blue-200/30",
    tint: "from-white/14 to-blue-100/7",
  },
  violet: {
    glow: "bg-violet-300/24",
    border: "border-violet-200/24",
    ring: "group-hover:ring-violet-200/30",
    tint: "from-white/14 to-violet-100/7",
  },
  rose: {
    glow: "bg-rose-300/24",
    border: "border-rose-200/24",
    ring: "group-hover:ring-rose-200/30",
    tint: "from-white/14 to-rose-100/7",
  },
  emerald: {
    glow: "bg-emerald-300/24",
    border: "border-emerald-200/24",
    ring: "group-hover:ring-emerald-200/30",
    tint: "from-white/14 to-emerald-100/7",
  },
  amber: {
    glow: "bg-amber-300/24",
    border: "border-amber-200/24",
    ring: "group-hover:ring-amber-200/30",
    tint: "from-white/14 to-amber-100/7",
  },
  slate: {
    glow: "bg-slate-300/16",
    border: "border-white/12",
    ring: "group-hover:ring-white/16",
    tint: "from-white/12 to-slate-100/5",
  },
};

export default function CardShell({
  children,
  accent = "slate",
  className,
  innerClassName,
}: CardShellProps) {
  const styles = accentMap[accent];

  return (
    <div className={cn("group relative", className)}>
      <div
        className={cn(
          "pointer-events-none absolute -inset-1 rounded-[28px] opacity-55 blur-xl transition-all duration-300 group-hover:opacity-80",
          styles.glow
        )}
      />

      <div
        className={cn(
          "relative rounded-[26px] border bg-gradient-to-br p-[1px] shadow-[0_10px_24px_rgba(0,0,0,0.14)] ring-1 transition-all duration-300 group-hover:-translate-y-0.5",
          styles.border,
          styles.ring,
          styles.tint
        )}
      >
        <div className={cn("rounded-[24px]", innerClassName)}>{children}</div>
      </div>
    </div>
  );
}