"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import UserDetailComponent from "@/screens/UserDetail";

export default function UserDetailRoutePage() {
  return (
    <PermissionGate anyOf={["users.view", "reseller.users.view"]}>
      <UserDetailComponent />
    </PermissionGate>
  );
}
