// lib/utils.ts

export function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(
  value?: string | number | Date | null,
  localeTag: string = "en-GB"
) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(localeTag, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}