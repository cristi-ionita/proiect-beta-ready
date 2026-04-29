"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
import { updateMyProfile } from "@/services/profile.api";

export default function OnboardingPersonalDataScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const address = [
    street.trim(),
    streetNumber.trim(),
    postalCode.trim(),
    city.trim(),
    country.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const canSave = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      phone.trim() &&
      street.trim() &&
      streetNumber.trim() &&
      city.trim() &&
      country.trim() &&
      postalCode.trim()
  );

  async function handleSave() {
    if (!canSave || saving) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateMyProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        address,
      });

      setSuccessMessage(t("profile", "profileUpdated"));

      window.setTimeout(() => {
        router.replace("/employee/dashboard");
      }, 900);
    } catch (err: unknown) {
      setErrorMessage(
        isApiClientError(err) ? err.message : t("profile", "failedToSaveProfile")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="back" onClick={() => router.push("/employee/onboarding")}>
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      {successMessage ? (
        <Alert variant="success" message={successMessage} />
      ) : null}

      {errorMessage ? <Alert variant="error" message={errorMessage} /> : null}

      <SectionCard
        title={t("profile", "personalData")}
        icon={<UserRound className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label={t("profile", "firstName")} required>
            <Input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
            />
          </FormField>

          <FormField label={t("profile", "lastName")} required>
            <Input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
            />
          </FormField>

          <FormField label={t("profile", "phone")} required>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
            />
          </FormField>

          <FormField label="Stradă" required>
            <Input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              autoComplete="address-line1"
            />
          </FormField>

          <FormField label="Număr" required>
            <Input
              value={streetNumber}
              onChange={(event) => setStreetNumber(event.target.value)}
              autoComplete="address-line2"
            />
          </FormField>

          <FormField label="Oraș" required>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              autoComplete="address-level2"
            />
          </FormField>

          <FormField label="Țară" required>
            <Input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              autoComplete="country-name"
            />
          </FormField>

          <FormField label="Cod poștal" required>
            <Input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              autoComplete="postal-code"
            />
          </FormField>
        </div>

        <div className="mt-5 flex justify-end">
          <Button disabled={!canSave || saving} loading={saving} onClick={handleSave}>
            {t("common", "save")}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}