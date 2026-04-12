"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import AlertsComponent from "@/screens/Alerts";

export default function AlertsRoutePage() {
  return (
    <FeatureGate feature="alerts">
      <AlertsComponent />
    </FeatureGate>
  );
}
