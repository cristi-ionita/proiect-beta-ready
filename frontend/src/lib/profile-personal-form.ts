import type { ProfileSummaryResponse } from "@/types/profile.types";

export type AddressParts = {
  street: string;
  streetNumber: string;
  apartment: string;
  postcode: string;
};

export type PersonalProfileFormState = {
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  streetNumber: string;
  apartment: string;
  postcode: string;
  iban: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const EMPTY_ADDRESS: AddressParts = {
  street: "",
  streetNumber: "",
  apartment: "",
  postcode: "",
};

export function normalizeSpaces(value: string) {
  return value.trimStart().replace(/\s+/g, " ");
}

export function toTitleCase(value: string) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeName(value: string) {
  return toTitleCase(value);
}

export function normalizeAddressText(value: string) {
  return toTitleCase(value);
}

export function normalizePostcode(value: string) {
  return value.toUpperCase().trimStart().replace(/\s+/g, " ");
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+\s()-]/g, "").trimStart();
}

export function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidIban(value: string) {
  const iban = normalizeIban(value);

  if (!iban) return true;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  if (iban.length < 15 || iban.length > 34) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let numeric = "";

  for (const ch of rearranged) {
    numeric += /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
  }

  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1;
}

export function parseAddress(address?: string | null): AddressParts {
  if (!address?.trim()) return EMPTY_ADDRESS;

  const streetMatch = address.match(/Street:\s*([^,]+)/i);
  const numberMatch = address.match(/Number:\s*([^,]+)/i);
  const apartmentMatch = address.match(/Apartment:\s*([^,]+)/i);
  const postcodeMatch = address.match(/Postcode:\s*([^,]+)/i);

  if (!streetMatch && !numberMatch && !apartmentMatch && !postcodeMatch) {
    return {
      street: address.trim(),
      streetNumber: "",
      apartment: "",
      postcode: "",
    };
  }

  return {
    street: streetMatch?.[1]?.trim() || "",
    streetNumber: numberMatch?.[1]?.trim() || "",
    apartment: apartmentMatch?.[1]?.trim() || "",
    postcode: postcodeMatch?.[1]?.trim() || "",
  };
}

export function formatAddressFromForm(address: AddressParts) {
  const parts = [
    address.street.trim() ? `Street: ${address.street.trim()}` : "",
    address.streetNumber.trim() ? `Number: ${address.streetNumber.trim()}` : "",
    address.apartment.trim() ? `Apartment: ${address.apartment.trim()}` : "",
    address.postcode.trim() ? `Postcode: ${address.postcode.trim()}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

export function buildPersonalProfileFormState(
  data: ProfileSummaryResponse
): PersonalProfileFormState {
  const profile = data.employee_profile;
  const address = parseAddress(profile?.address);

  return {
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
    street: address.street,
    streetNumber: address.streetNumber,
    apartment: address.apartment,
    postcode: address.postcode,
    iban: profile?.iban || "",
    emergency_contact_name: profile?.emergency_contact_name || "",
    emergency_contact_phone: profile?.emergency_contact_phone || "",
  };
}