import type { ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type HeroStatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
};

export default function HeroStatCard({
  icon,
  label,
  value,
  className,
  valueClassName,
}: HeroStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-white/10 bg-white/10 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span className="text-white">{icon}</span>
        <span>{label}</span>
      </div>

      <div
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight text-white",
          valueClassName
        )}
      >
        {value}
      </div>
    </div>
  );
}