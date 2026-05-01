import type { ReactNode } from "react";

import Card from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function ListRow({
  leading,
  title,
  subtitle,
  meta,
  badge,
  actions,
  onClick,
  className,
}: ListRowProps) {
  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={cn("p-4", className)}
    >
      <div className="grid min-w-0 grid-cols-[auto_1fr] gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        {leading ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 text-white">
            {leading}
          </div>
        ) : null}

        <div
          className={cn(
            "min-w-0",
            !leading && "col-span-2 sm:col-span-1"
          )}
        >
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold leading-5 text-white sm:text-base">
                {title}
              </div>

              {subtitle ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-400 sm:truncate sm:text-sm">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {badge ? (
              <div className="flex shrink-0 items-center sm:justify-end">
                {badge}
              </div>
            ) : null}
          </div>

          {meta ? (
            <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs text-slate-300">
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="col-span-2 flex min-w-0 justify-end gap-2 border-t border-white/10 pt-3 sm:col-span-1 sm:border-t-0 sm:pt-0">
            {actions}
          </div>
        ) : null}
      </div>
    </Card>
  );
}