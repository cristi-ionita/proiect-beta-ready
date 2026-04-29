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
      className={cn("p-3", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              {leading}
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-1">
              {badge ? <div className="shrink-0">{badge}</div> : null}

              <p className="truncate text-sm font-semibold text-white">
                {title}
              </p>

              {subtitle ? (
                <p className="truncate text-xs text-slate-400">{subtitle}</p>
              ) : null}
            </div>

            {meta ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">{meta}</div>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 justify-end sm:ml-3">{actions}</div>
        ) : null}
      </div>
    </Card>
  );
}