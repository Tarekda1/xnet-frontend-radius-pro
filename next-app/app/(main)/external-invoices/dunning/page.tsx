"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import ExternalInvoicesDunningComponent from "@/screens/ExternalInvoicesDunning";

export default function ExternalInvoicesDunningRoutePage() {
  return (
    <FeatureGate feature="external-invoices">
      <ExternalInvoicesDunningComponent />
    </FeatureGate>
  );
}
