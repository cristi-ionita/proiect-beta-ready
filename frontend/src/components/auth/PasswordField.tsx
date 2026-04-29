"use client";

import { Eye, EyeOff } from "lucide-react";

import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
};

export default function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: Props) {
  return (
    <FormField label={label} required>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-12"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </FormField>
  );
}