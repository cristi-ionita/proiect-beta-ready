import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionCard({
  children,
  title,
  icon,
  actions,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-[26px] border border-white/10 bg-white/10 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl",
        className
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                {icon}
              </div>
            ) : null}

            {title ? (
              <h2 className="text-[15px] font-semibold text-white">
                {title}
              </h2>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}

      <div className={cn(contentClassName)}>{children}</div>
    </section>
  );
}