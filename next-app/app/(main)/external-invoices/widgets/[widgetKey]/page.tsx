"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import ExternalInvoicesWidgetDetailsComponent from "@/screens/ExternalInvoicesWidgetDetails";

export default function ExternalInvoicesWidgetDetailsRoutePage() {
  return (
    <FeatureGate feature="external-invoices">
      <ExternalInvoicesWidgetDetailsComponent />
    </FeatureGate>
  );
}
