"use client";

import { isFeatureEnabled } from "@/lib/featureFlags";
import { notFound } from "next/navigation";

export function FeatureGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  if (!isFeatureEnabled(feature)) notFound();
  return <>{children}</>;
}
