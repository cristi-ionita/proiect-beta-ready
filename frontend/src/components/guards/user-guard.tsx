"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import LoadingState from "@/components/ui/loading-state";
import { getSession } from "@/lib/auth";
import { getMyDocuments } from "@/services/documents.api";
import { getMyProfileSummary } from "@/services/profile.api";

type UserGuardProps = {
  children: ReactNode;
};

function isProfileComplete(profile: unknown) {
  const data = profile as {
    employee_profile?: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      address?: string | null;
    } | null;
  };

  const employeeProfile = data?.employee_profile;

  return Boolean(
    employeeProfile?.first_name?.trim() &&
      employeeProfile?.last_name?.trim() &&
      employeeProfile?.phone?.trim() &&
      employeeProfile?.address?.trim()
  );
}

function areRequiredDocumentsUploaded(
  documents: Array<{ type?: string | null }>
) {
  const types = documents.map((document) =>
    String(document.type || "").toUpperCase()
  );

  return (
    (types.includes("ID_CARD") || types.includes("PASSPORT")) &&
    types.includes("DRIVER_LICENSE")
  );
}

export default function UserGuard({ children }: UserGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const session = getSession();

      const allowed = Boolean(
        session && session.role === "employee" && session.user_id
      );

      if (!allowed) {
        setHasAccess(false);
        setIsChecking(false);
        router.replace("/");
        return;
      }

      const isOnboardingRoute = pathname.startsWith("/employee/onboarding");

      try {
        const [profile, documents] = await Promise.all([
          getMyProfileSummary(),
          getMyDocuments(),
        ]);

        const safeDocuments = Array.isArray(documents) ? documents : [];

        const onboardingComplete =
          isProfileComplete(profile) &&
          areRequiredDocumentsUploaded(safeDocuments);

        if (!onboardingComplete) {
          if (!isOnboardingRoute) {
            router.replace("/employee/onboarding");
            return;
          }

          setHasAccess(true);
          return;
        }

        if (isOnboardingRoute) {
          router.replace("/employee/dashboard");
          return;
        }

        setHasAccess(true);
      } catch (err) {
        console.error("[UserGuard] onboarding check failed:", err);

        if (!isOnboardingRoute) {
          router.replace("/employee/onboarding");
          return;
        }

        setHasAccess(true);
      } finally {
        setIsChecking(false);
      }
    }

    void checkAccess();
  }, [pathname, router]);

  if (isChecking || !hasAccess) {
    return <LoadingState />;
  }

  return <>{children}</>;
}