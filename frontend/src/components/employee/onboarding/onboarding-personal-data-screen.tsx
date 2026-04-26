"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";

import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";

import { isApiClientError } from "@/lib/api-error";
import { updateMyProfile } from "@/services/profile.api";

export default function OnboardingPersonalDataScreen() {
  const router = useRouter();

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

  const canSave =
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    street.trim() &&
    streetNumber.trim() &&
    city.trim() &&
    country.trim() &&
    postalCode.trim();

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

      setSuccessMessage("Profil complet! Datele au fost salvate cu succes.");

      setTimeout(() => {
        router.replace("/employee/dashboard");
      }, 900);
    } catch (err) {
      setErrorMessage(
        isApiClientError(err)
          ? err.message || "Nu s-au putut salva datele."
          : "Nu s-au putut salva datele."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/employee/onboarding")}
        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi
      </Button>

      {successMessage ? (
        <Alert variant="success" message={successMessage} />
      ) : null}

      {errorMessage ? (
        <Alert variant="error" message={errorMessage} />
      ) : null}

      <SectionCard
        title="Date personale"
        icon={<UserRound className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Prenume" required>
            <Input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </FormField>

          <FormField label="Nume" required>
            <Input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </FormField>

          <FormField label="Număr de telefon" required>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </FormField>

          <FormField label="Stradă" required>
            <Input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
            />
          </FormField>

          <FormField label="Număr" required>
            <Input
              value={streetNumber}
              onChange={(event) => setStreetNumber(event.target.value)}
            />
          </FormField>

          <FormField label="Oraș" required>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </FormField>

          <FormField label="Țară" required>
            <Input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </FormField>

          <FormField label="Cod poștal" required>
            <Input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
            />
          </FormField>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            disabled={!canSave || saving}
            loading={saving}
            onClick={handleSave}
          >
            Salvează datele
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}