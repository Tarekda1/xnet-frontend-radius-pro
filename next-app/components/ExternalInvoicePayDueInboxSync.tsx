"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";
import { fetchExternalInvoicesPaymentDue } from "@/api/invoices";
import { useNotificationInboxStore } from "@/store/notificationInboxStore";

function localYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shouldIngestPayDue(ymd: string): boolean {
  const limit = new Date();
  limit.setDate(limit.getDate() + 14);
  const limitKey = localYmd(limit);
  return ymd <= limitKey;
}

/** Background sync: pushes pay-due reminders into the bell inbox (deduped). */
export default function ExternalInvoicePayDueInboxSync() {
  const { user } = useAuth();
  const ingest = useNotificationInboxStore((s) => s.ingest);
  const lastSignature = useRef<string>("");

  const allowed = Boolean(
    user &&
      canAny(user, [
        "billing.externalInvoices.view",
        "billing.externalInvoices.viewTotals",
        "billing.externalInvoices.pay",
        "billing.externalInvoices.unpay",
      ])
  );

  const { data } = useQuery({
    queryKey: ["externalInvoicesPaymentDueInbox"],
    queryFn: fetchExternalInvoicesPaymentDue,
    enabled: allowed,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });

  useEffect(() => {
    if (!data?.length) return;
    const signature = data.map((i) => `${i.id}:${i.payDueDate ?? ""}`).join("|");
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;

    for (const inv of data) {
      const ymd = inv.payDueDate ? String(inv.payDueDate).slice(0, 10) : "";
      if (!ymd || !shouldIngestPayDue(ymd)) continue;
      const todayKey = localYmd();
      const overdue = ymd < todayKey;
      const title = overdue ? "Payment overdue" : "Payment due soon";
      const body = `${inv.fullName} (#${inv.id}) — $${Number(inv.amount).toFixed(2)} · due ${ymd}`;
      ingest({
        id: `pay-due-${inv.id}-${ymd}`,
        category: "pay_due",
        title,
        body,
        createdAt: new Date().toISOString(),
        read: false,
        source: "topic",
        channel: "external/payment-due",
        href: `/external-invoices?q=${encodeURIComponent(String(inv.id))}`,
        meta: {
          dedupeKey: `pay-due:${inv.id}:${ymd}`,
          invoiceId: inv.id,
          username: inv.username,
          amount: inv.amount,
        },
      });
    }
  }, [data, ingest]);

  return null;
}
