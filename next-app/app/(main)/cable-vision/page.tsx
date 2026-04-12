"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import CableVisionComponent from "@/screens/CableVision/index";

export default function CableVisionRoutePage() {
  return (
    <PermissionGate anyOf={["cablevision.accounts.view", "cablevision.accounts.manage"]}>
      <CableVisionComponent />
    </PermissionGate>
  );
}
