import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";

type Props = {
  /** If user has ANY of these permissions, allow. */
  anyOf: string[];
  /** Render mode when not allowed. */
  mode?: "hide" | "disable";
  /** Optional reason shown as title when disabled. */
  reason?: string;
  /** Rendered when mode=hide and not allowed. */
  fallback?: React.ReactNode;
  /** Child element to render/disable */
  children: React.ReactElement;
};

export default function RequirePermission({
  anyOf,
  mode = "hide",
  reason = "You don't have permission to perform this action.",
  fallback = null,
  children,
}: Props) {
  const { user } = useAuth();
  const allowed = canAny(user, anyOf);

  if (allowed) return children;
  if (mode === "hide") return <>{fallback}</>;

  // disable mode
  const childProps: Record<string, unknown> = {
    disabled: true,
    "aria-disabled": true,
    title: reason,
  };
  return React.cloneElement(children, childProps);
}

