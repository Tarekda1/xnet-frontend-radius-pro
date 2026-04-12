"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import ExternalInvoicesComponent from "@/screens/Externalnvoices";

export default function ExternalInvoicesRoutePage() {
  return (
    <FeatureGate feature="external-invoices">
      <ExternalInvoicesComponent />
    </FeatureGate>
  );
}
