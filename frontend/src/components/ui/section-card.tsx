import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SectionCard({
  children,
  title,
  icon,
  actions,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-[26px] border border-white/10 bg-white/10 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl",
        className
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
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
    </div>
  );
}