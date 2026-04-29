"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import LoadingState from "@/components/ui/loading-state";
import { getAdminToken } from "@/lib/auth";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const allowed = Boolean(getAdminToken());

    if (!allowed) {
      setHasAccess(false);
      setIsChecking(false);
      router.replace("/?sessionExpired=1");
      return;
    }

    setHasAccess(true);
    setIsChecking(false);
  }, [router]);

  if (isChecking || !hasAccess) {
    return <LoadingState />;
  }

  return <>{children}</>;
}