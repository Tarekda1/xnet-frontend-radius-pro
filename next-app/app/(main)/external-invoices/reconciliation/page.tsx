"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import ExternalInvoicesReconciliationComponent from "@/screens/ExternalInvoicesReconciliation";

export default function ExternalInvoicesReconciliationRoutePage() {
  return (
    <FeatureGate feature="external-invoices">
      <ExternalInvoicesReconciliationComponent />
    </FeatureGate>
  );
}
