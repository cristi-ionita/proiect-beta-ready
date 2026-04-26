"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import LoadingState from "@/components/ui/loading-state";
import { getSession } from "@/lib/auth";

type MechanicGuardProps = {
  children: ReactNode;
};

export default function MechanicGuard({ children }: MechanicGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const session = getSession();

    const allowed = Boolean(
      session && session.role === "mechanic" && session.user_id
    );

    if (!allowed) {
      setHasAccess(false);
      setIsChecking(false);
      router.replace("/");
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