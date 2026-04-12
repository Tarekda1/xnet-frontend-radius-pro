"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import { PermissionGate } from "@/components/auth/PermissionGate";
import BackupsComponent from "@/screens/Backups";

export default function BackupsRoutePage() {
  return (
    <FeatureGate feature="backups">
      <PermissionGate anyOf={["admin.access.manage"]}>
        <BackupsComponent />
      </PermissionGate>
    </FeatureGate>
  );
}
