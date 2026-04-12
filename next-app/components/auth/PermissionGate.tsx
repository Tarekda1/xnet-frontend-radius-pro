"use client";

import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PermissionGate({ anyOf, children }: { anyOf: string[]; children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!canAny(user, anyOf)) router.replace("/forbidden");
  }, [isAuthenticated, user, anyOf, router]);

  if (!isAuthenticated || !canAny(user, anyOf)) return null;
  return <>{children}</>;
}
