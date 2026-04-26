import type { ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
        "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md",
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