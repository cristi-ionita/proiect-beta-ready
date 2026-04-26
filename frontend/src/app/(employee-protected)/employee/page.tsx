"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import EmployeeDashboardScreen from "@/components/employee/dashboard/employee-dashboard-screen";
import { useOnboardingGuard } from "@/hooks/use-onboarding-guard";

export default function Page() {
  const router = useRouter();
  const { loading, onboardingComplete } = useOnboardingGuard();

  useEffect(() => {
    if (!loading && !onboardingComplete) {
      router.replace("/employee/onboarding");
    }
  }, [loading, onboardingComplete, router]);

  if (loading || !onboardingComplete) {
    return null; // sau loading component
  }

  return <EmployeeDashboardScreen />;
}