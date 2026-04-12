"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import OnlineUsersComponent from "@/screens/OnlineUsers";

export default function OnlineUsersRoutePage() {
  return (
    <PermissionGate anyOf={["users.online.view", "reseller.users.view"]}>
      <OnlineUsersComponent />
    </PermissionGate>
  );
}
