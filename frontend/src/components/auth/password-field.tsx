"use client";

import { Eye, EyeOff } from "lucide-react";

import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";

type PasswordFieldProps = {
  label: string;
  value: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export default function PasswordField({
  label,
  value,
  visible,
  onToggleVisibility,
  onChange,
  ariaLabel,
}: PasswordFieldProps) {
  return (
    <FormField label={label} required>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          className="pr-12"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
          aria-label={ariaLabel}
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </FormField>
  );
}