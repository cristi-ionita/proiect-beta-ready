"use client";

import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur-md transition",
        "min-h-[120px] resize-y",
        "placeholder:text-slate-400",
        "focus:border-white/20 focus:ring-2 focus:ring-white/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}