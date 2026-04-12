"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import CollectionsComponent from "@/screens/Collections";

export default function CollectionsRoutePage() {
  return (
    <FeatureGate feature="collections">
      <CollectionsComponent />
    </FeatureGate>
  );
}
