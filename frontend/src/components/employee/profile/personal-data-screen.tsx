"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Phone, Save, User } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useProfileSummary } from "@/hooks/profile/use-profile-summary";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
import { updateMyProfile } from "@/services/profile.api";

type FormState = {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  iban: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const REQUIRED_FIELDS: (keyof FormState)[] = [
  "first_name",
  "last_name",
  "phone",
  "address",
  "iban",
  "emergency_contact_name",
  "emergency_contact_phone",
];

function capitalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

function normalizeField(field: keyof FormState, value: string) {
  if (field === "iban") {
    return value.replace(/\s+/g, "").toUpperCase();
  }

  if (
    field === "first_name" ||
    field === "last_name" ||
    field === "address" ||
    field === "emergency_contact_name"
  ) {
    return capitalizeWords(value);
  }

  return value.trim();
}

export default function PersonalProfileScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error, refetch } = useProfileSummary();

  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    iban: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const profile = data?.employee_profile;

    if (!profile) return;

    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      iban: profile.iban ?? "",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
    });
  }, [data]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === "iban" ? value.toUpperCase() : value,
    }));

    setSuccessMessage("");
    setSubmitError("");
  }

  async function handleSave() {
    const normalizedForm = Object.fromEntries(
      Object.entries(form).map(([field, value]) => [
        field,
        normalizeField(field as keyof FormState, value),
      ])
    ) as FormState;

    const missingField = REQUIRED_FIELDS.find(
      (field) => !normalizedForm[field]
    );

    if (missingField) {
      setSubmitError("Completează toate câmpurile obligatorii.");
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setSubmitError("");

      await updateMyProfile(normalizedForm);
      await refetch();

      setForm(normalizedForm);
      setSuccessMessage(t("profile", "profileUpdated"));
    } catch (err: unknown) {
      setSubmitError(
        isApiClientError(err) ? err.message : t("profile", "failedToSaveProfile")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push("/employee/profile")}
      >
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("profile", "personalData")}
        icon={<User className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ?? t("profile", "failedToLoadProfile")}
          isEmpty={!data}
          emptyTitle={t("profile", "noProfileData")}
          emptyDescription={t("profile", "profileDataUnavailable")}
        >
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <ProfileInput
                icon={<User className="h-4 w-4" />}
                label={t("profile", "firstName")}
                value={form.first_name}
                onChange={(value) => handleChange("first_name", value)}
                autoComplete="given-name"
              />

              <ProfileInput
                icon={<User className="h-4 w-4" />}
                label={t("profile", "lastName")}
                value={form.last_name}
                onChange={(value) => handleChange("last_name", value)}
                autoComplete="family-name"
              />

              <ProfileInput
                icon={<Phone className="h-4 w-4" />}
                label={t("profile", "phone")}
                value={form.phone}
                onChange={(value) => handleChange("phone", value)}
                autoComplete="tel"
              />

              <ProfileInput
                icon={<MapPin className="h-4 w-4" />}
                label={t("profile", "address")}
                value={form.address}
                onChange={(value) => handleChange("address", value)}
                autoComplete="street-address"
              />

              <ProfileInput
                icon={<CreditCard className="h-4 w-4" />}
                label="IBAN"
                value={form.iban}
                onChange={(value) => handleChange("iban", value)}
                autoComplete="off"
              />

              <ProfileInput
                icon={<User className="h-4 w-4" />}
                label={t("profile", "emergencyContactName")}
                value={form.emergency_contact_name}
                onChange={(value) =>
                  handleChange("emergency_contact_name", value)
                }
                autoComplete="name"
              />

              <ProfileInput
                icon={<Phone className="h-4 w-4" />}
                label={t("profile", "emergencyContactPhone")}
                value={form.emergency_contact_phone}
                onChange={(value) =>
                  handleChange("emergency_contact_phone", value)
                }
                autoComplete="tel"
              />
            </div>

            {successMessage ? (
              <Alert variant="success" message={successMessage} />
            ) : null}

            {submitError ? <Alert variant="error" message={submitError} /> : null}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                loading={saving}
              >
                <Save className="h-4 w-4" />
                {t("common", "save")}
              </Button>
            </div>
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
  );
}

function ProfileInput({
  icon,
  label,
  value,
  onChange,
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
        <span className="text-red-300">*</span>
      </div>

      <Input
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}