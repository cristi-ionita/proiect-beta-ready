import type { ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type InfoCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  badge?: boolean;
  className?: string;
  valueClassName?: string;
};

export default function InfoCard({
  icon,
  title,
  value,
  badge = false,
  className,
  valueClassName,
}: InfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-black text-white">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-300">
        {title}
      </p>

      {badge ? (
        <span
          className={cn(
            "mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold",
            valueClassName
          )}
        >
          {value}
        </span>
      ) : (
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight text-white",
            valueClassName
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}