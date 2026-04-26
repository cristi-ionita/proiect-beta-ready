import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  interactive?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "onClick">;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Card({
  children,
  interactive = false,
  active = false,
  onClick,
  className,
  ...props
}: CardProps) {
  const isClickable = interactive && typeof onClick === "function";

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group w-full rounded-[26px] border border-white/10 bg-white/10 p-4 text-left shadow-[0_8px_18px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all duration-300 ease-out",
          "cursor-pointer hover:-translate-y-1 hover:bg-white/14 hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)] active:scale-[0.985]",
          active && "ring-2 ring-white/20",
          className
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[26px] border border-white/10 bg-white/10 p-4 shadow-[0_8px_18px_rgba(0,0,0,0.16)] backdrop-blur-md",
        active && "ring-2 ring-white/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}