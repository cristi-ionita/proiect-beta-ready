import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export default function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
        {label}
        {required ? <span className="ml-1 text-rose-400">*</span> : null}
      </label>

      {children}

      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}