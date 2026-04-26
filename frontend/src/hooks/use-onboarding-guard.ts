"use client";

import { useEffect, useState } from "react";
import { getMyDocuments } from "@/services/documents.api";
import { getMyProfileSummary } from "@/services/profile.api";

type DocumentType = "ID_CARD" | "PASSPORT" | "DRIVER_LICENSE";

function isProfileComplete(profile: unknown) {
  const data = profile as {
    employee_profile?: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      address?: string | null;
    } | null;
  };

  const employeeProfile = data.employee_profile;

  return Boolean(
    employeeProfile?.first_name?.trim() &&
      employeeProfile?.last_name?.trim() &&
      employeeProfile?.phone?.trim() &&
      employeeProfile?.address?.trim()
  );
}

function extractDocumentTypes(
  documents: Array<{ type?: string | null }>
): string[] {
  return documents.map((d) => String(d.type || "").toUpperCase());
}

export function useOnboardingGuard() {
  const [loading, setLoading] = useState(true);

  const [profileComplete, setProfileComplete] = useState(false);
  const [hasIdentityDocument, setHasIdentityDocument] = useState(false);
  const [hasDriverLicense, setHasDriverLicense] = useState(false);

  const onboardingComplete =
    profileComplete && hasIdentityDocument && hasDriverLicense;

  async function check() {
    setLoading(true);

    try {
      const [profile, docs] = await Promise.all([
        getMyProfileSummary(),
        getMyDocuments(),
      ]);

      const safeDocs = Array.isArray(docs) ? docs : [];

      const types = extractDocumentTypes(safeDocs);

      const identity =
        types.includes("ID_CARD") || types.includes("PASSPORT");

      const license = types.includes("DRIVER_LICENSE");

      setProfileComplete(isProfileComplete(profile));
      setHasIdentityDocument(identity);
      setHasDriverLicense(license);
    } catch {
      // fallback: considerăm incomplet → onboarding rămâne activ
      setProfileComplete(false);
      setHasIdentityDocument(false);
      setHasDriverLicense(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void check();
  }, []);

  return {
    loading,

    // 🔹 granular (UI control)
    profileComplete,
    hasIdentityDocument,
    hasDriverLicense,

    // 🔹 final flag
    onboardingComplete,

    // 🔹 refresh după upload / save
    refreshOnboardingStatus: check,
  };
}