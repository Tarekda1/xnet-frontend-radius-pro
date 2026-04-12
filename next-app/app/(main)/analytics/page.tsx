"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import AnalyticsComponent from "@/screens/Analytics";

export default function AnalyticsRoutePage() {
  return (
    <FeatureGate feature="analytics">
      <AnalyticsComponent />
    </FeatureGate>
  );
}
