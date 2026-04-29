import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeroProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function PageHero({
  icon,
  title,
  description,
  actions,
  stats,
  className,
  contentClassName,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-xl",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
          contentClassName
        )}
      >
        <div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 text-white backdrop-blur-md">
            {icon}
          </div>

          <h1 className="mt-4 text-[32px] font-semibold tracking-tight text-white">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {stats && <div className="mt-6">{stats}</div>}
    </section>
  );
}