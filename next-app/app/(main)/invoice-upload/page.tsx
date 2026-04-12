"use client";

import { FeatureGate } from "@/components/auth/FeatureGate";
import Component from "@/screens/InvoiceUpload";

export default function InvoiceUploadRoutePage() {
  return (
    <FeatureGate feature="invoice-upload">
      <Component />
    </FeatureGate>
  );
}
