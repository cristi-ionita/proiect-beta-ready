"use client";

import { Eye, EyeOff } from "lucide-react";

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
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-[42px] rounded-md p-1 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
      >
        {show ? (
          <EyeOff className="h-[18px] w-[18px]" />
        ) : (
          <Eye className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
}