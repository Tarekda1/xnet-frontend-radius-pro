import type { ExternalInvoice } from "@/types/api";

export type WorkflowStage = "new" | "reminded" | "promise_to_pay" | "escalated" | "resolved";
export type WorkflowTone = "default" | "warning" | "destructive" | "success";
export type AgingBucketKey = "current" | "1_30" | "31_60" | "61_90" | "90_plus";

export function getDueDate(billingMonth: string, graceDays = 7): Date {
  const billing = new Date(billingMonth);
  if (Number.isNaN(billing.getTime())) return new Date();
  const due = new Date(billing.getFullYear(), billing.getMonth() + 1, 0);
  due.setDate(due.getDate() + Math.max(0, graceDays));
  due.setHours(23, 59, 59, 999);
  return due;
}

export function getOverdueDays(invoice: ExternalInvoice, graceDays = 7, asOf = new Date()): number {
  const due = getDueDate(invoice.billingMonth, graceDays);
  return Math.floor((asOf.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
}

export function getAgingBucket(invoice: ExternalInvoice, graceDays = 7): AgingBucketKey {
  const overdueDays = getOverdueDays(invoice, graceDays);
  if (overdueDays <= 0) return "current";
  if (overdueDays <= 30) return "1_30";
  if (overdueDays <= 60) return "31_60";
  if (overdueDays <= 90) return "61_90";
  return "90_plus";
}

export function parseWorkflowStageFromLastAction(lastAction?: string | null): WorkflowStage | null {
  const raw = String(lastAction || "").toLowerCase();
  const match = /workflow:(new|reminded|promise_to_pay|escalated|resolved)/.exec(raw);
  return (match?.[1] as WorkflowStage | undefined) || null;
}

export function parsePromiseDateFromLastAction(lastAction?: string | null): string | null {
  const raw = String(lastAction || "");
  const match = /promise:(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match?.[1] || null;
}

export function deriveWorkflowStage(invoice: ExternalInvoice, graceDays = 7): WorkflowStage {
  if (invoice.status === "paid") return "resolved";
  const explicit = parseWorkflowStageFromLastAction(invoice.lastAction);
  if (explicit) return explicit;

  const action = String(invoice.lastAction || "").toLowerCase();
  if (action.includes("remind") || action.includes("dunning_stage") || action.includes("throttle") || action.includes("suspend")) {
    return "reminded";
  }

  const overdueDays = getOverdueDays(invoice, graceDays);
  if (overdueDays >= 30) return "escalated";
  return "new";
}

export function getWorkflowTone(stage: WorkflowStage): WorkflowTone {
  if (stage === "resolved") return "success";
  if (stage === "escalated") return "destructive";
  if (stage === "reminded" || stage === "promise_to_pay") return "warning";
  return "default";
}

export function getWorkflowLabel(stage: WorkflowStage): string {
  if (stage === "promise_to_pay") return "Promise to Pay";
  if (stage === "resolved") return "Resolved";
  if (stage === "escalated") return "Escalated";
  if (stage === "reminded") return "Reminded";
  return "New";
}

export function buildReminderMessagePreview(invoice: ExternalInvoice): string {
  const month = invoice.billingMonth ? String(invoice.billingMonth).slice(0, 10) : "";
  const amountValue = typeof invoice.amount === "number" ? invoice.amount.toFixed(2) : String(invoice.amount ?? "");
  const name = invoice.fullName || invoice.username || "Customer";
  return (
    `Hi ${name}, this is a payment reminder for Invoice #${invoice.id}` +
    (month ? ` (Billing month: ${month})` : "") +
    (amountValue ? `, amount: $${amountValue}` : "") +
    `. Status: ${invoice.status || "unpaid"}. Thank you.`
  );
}

export type ReconciliationFlag = "missing_payment" | "duplicate" | "amount_mismatch";

export function getReconciliationFlagsMap(invoices: ExternalInvoice[]): Map<number, ReconciliationFlag[]> {
  const map = new Map<number, ReconciliationFlag[]>();

  const grouped = new Map<string, ExternalInvoice[]>();
  for (const inv of invoices) {
    const key = `${inv.username || ""}::${String(inv.billingMonth || "").slice(0, 10)}`;
    const list = grouped.get(key) || [];
    list.push(inv);
    grouped.set(key, list);
  }

  for (const inv of invoices) {
    const flags: ReconciliationFlag[] = [];
    const status = String(inv.status || "").toLowerCase();
    const hasPaidAt = Boolean(inv.paidAt);
    if ((status === "paid" && !hasPaidAt) || (status !== "paid" && hasPaidAt)) {
      flags.push("missing_payment");
    }

    const key = `${inv.username || ""}::${String(inv.billingMonth || "").slice(0, 10)}`;
    const siblings = grouped.get(key) || [];
    if (siblings.length > 1) {
      const amountSet = new Set(siblings.map((s) => Number(s.amount || 0).toFixed(2)));
      if (amountSet.size > 1) flags.push("amount_mismatch");
      else flags.push("duplicate");
    }

    if (flags.length > 0) map.set(inv.id, flags);
  }

  return map;
}
