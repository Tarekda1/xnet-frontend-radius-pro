"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import AuthFailuresComponent from "@/screens/AuthFailures";

export default function AuthFailuresRoutePage() {
  return (
    <PermissionGate anyOf={["users.online.view", "reseller.users.view"]}>
      <AuthFailuresComponent />
    </PermissionGate>
  );
}
