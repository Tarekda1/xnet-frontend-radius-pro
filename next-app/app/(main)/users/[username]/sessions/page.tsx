"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import UserSessionsComponent from "@/screens/UserSessions";

export default function UserSessionsRoutePage() {
  return (
    <PermissionGate anyOf={["users.view", "reseller.users.view"]}>
      <UserSessionsComponent />
    </PermissionGate>
  );
}
