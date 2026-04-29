import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardShellAccent =
  | "blue"
  | "violet"
  | "rose"
  | "emerald"
  | "amber"
  | "slate";

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
    glow: "bg-blue-300/20",
    border: "border-blue-200/20",
    ring: "group-hover:ring-blue-200/30",
    tint: "from-white/10 to-blue-100/5",
  },
  violet: {
    glow: "bg-violet-300/20",
    border: "border-violet-200/20",
    ring: "group-hover:ring-violet-200/30",
    tint: "from-white/10 to-violet-100/5",
  },
  rose: {
    glow: "bg-rose-300/20",
    border: "border-rose-200/20",
    ring: "group-hover:ring-rose-200/30",
    tint: "from-white/10 to-rose-100/5",
  },
  emerald: {
    glow: "bg-emerald-300/20",
    border: "border-emerald-200/20",
    ring: "group-hover:ring-emerald-200/30",
    tint: "from-white/10 to-emerald-100/5",
  },
  amber: {
    glow: "bg-amber-300/20",
    border: "border-amber-200/20",
    ring: "group-hover:ring-amber-200/30",
    tint: "from-white/10 to-amber-100/5",
  },
  slate: {
    glow: "bg-slate-300/15",
    border: "border-white/10",
    ring: "group-hover:ring-white/20",
    tint: "from-white/10 to-slate-100/5",
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
      {/* glow */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-1 rounded-[28px] opacity-50 blur-xl transition group-hover:opacity-70",
          styles.glow
        )}
      />

      {/* shell */}
      <div
        className={cn(
          "relative rounded-[26px] border bg-gradient-to-br p-[1px] ring-1 transition group-hover:-translate-y-0.5",
          styles.border,
          styles.ring,
          styles.tint
        )}
      >
        {/* inner */}
        <div
          className={cn(
            "rounded-[24px] bg-white/5 backdrop-blur-md",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}