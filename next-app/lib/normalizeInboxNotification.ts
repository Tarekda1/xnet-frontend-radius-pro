import type { InboxNotification, InboxNotificationCategory } from "@/types/notifications";

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function userHref(username: string | undefined): string | undefined {
  if (!username || typeof username !== "string") return undefined;
  const u = username.trim();
  if (!u) return undefined;
  return `/users/${encodeURIComponent(u)}`;
}

/** Parsed body from `/queue/user_actions_queue` (invoice actions, etc.). */
export function normalizeUserActionsQueuePayload(raw: unknown): InboxNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const type = String(data.type ?? "");

  let category: InboxNotificationCategory = "system";
  let title = typeof data.title === "string" ? data.title : "Notification";
  let body =
    typeof data.message === "string"
      ? data.message
      : typeof data.description === "string"
        ? data.description
        : "";
  let href: string | undefined;
  let invoiceId: number | undefined;
  let username: string | undefined;
  let amount: number | undefined;
  let dedupeKey: string | undefined;

  const createdAt =
    typeof data.timestamp === "string" && data.timestamp
      ? data.timestamp
      : new Date().toISOString();

  if (type === "INVOICE_PAID") {
    category = "invoice";
    title = "Invoice paid";
    invoiceId = Number(data.invoiceId);
    username = String(data.username ?? "");
    amount = Number(data.amount ?? 0);
    body = body || `Invoice #${invoiceId} paid by ${username}`;
    href = userHref(username);
    dedupeKey = `INVOICE_PAID:${invoiceId}:${username}:${data.paidAt ?? data.timestamp ?? ""}`;
  } else if (type === "INVOICE_MODIFICATION") {
    category = "invoice";
    title = typeof data.title === "string" ? data.title : "Invoice update";
    const nested = data.data as Record<string, unknown> | undefined;
    invoiceId = nested?.invoiceId != null ? Number(nested.invoiceId) : undefined;
    username = nested?.username != null ? String(nested.username) : undefined;
    body = body || (typeof data.message === "string" ? data.message : "Invoice was modified.");
    href = userHref(username);
    const ts = typeof data.timestamp === "string" ? data.timestamp : "";
    dedupeKey = `INVOICE_MODIFICATION:${invoiceId ?? "?"}:${username ?? "?"}:${ts}`;
  } else if (type === "EXTERNAL_INVOICE_PAID") {
    category = "external_invoice";
    title = typeof data.title === "string" ? data.title : "External invoice";
    const nested = data.data as Record<string, unknown> | undefined;
    invoiceId = nested?.invoiceId != null ? Number(nested.invoiceId) : undefined;
    username = nested?.username != null ? String(nested.username) : undefined;
    amount = nested?.amount != null ? Number(nested.amount) : undefined;
    body = body || (typeof data.message === "string" ? data.message : "External invoice event.");
    href = userHref(username);
    const ts = typeof data.timestamp === "string" ? data.timestamp : "";
    dedupeKey = `EXTERNAL_INVOICE_PAID:${invoiceId ?? "?"}:${username ?? "?"}:${ts}`;
  } else {
    const snippet = typeof data.message === "string" ? data.message : JSON.stringify(data).slice(0, 160);
    dedupeKey = `queue:${type || "unknown"}:${createdAt}:${snippet}`;
    if (!body) body = `${title}${type ? ` (${type})` : ""}`.trim();
  }

  return {
    id: newId(),
    category,
    title,
    body,
    createdAt,
    read: false,
    source: "queue",
    channel: "/queue/user_actions_queue",
    href,
    meta: {
      invoiceId: Number.isFinite(invoiceId) ? invoiceId : undefined,
      username,
      amount: Number.isFinite(amount) ? amount : undefined,
      dedupeKey,
      rawType: type || undefined,
    },
  };
}

/** Parsed body from `/topic/user-status`. */
export function normalizeUserStatusPayload(raw: unknown): InboxNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const username = String(data.username ?? data.user ?? "");
  const status = String(data.status ?? data.newStatus ?? data.accountStatus ?? "—");
  const body =
    typeof data.message === "string"
      ? data.message
      : username
        ? `${username} is now ${status}`
        : `Status: ${status}`;

  return {
    id: newId(),
    category: "user_status",
    title: "User status",
    body,
    createdAt: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
    read: false,
    source: "topic",
    channel: "/topic/user-status",
    href: userHref(username) || undefined,
    meta: {
      username: username || undefined,
      dedupeKey: `USER_STATUS:${username}:${status}:${data.timestamp ?? ""}`,
      rawType: typeof data.type === "string" ? data.type : "USER_STATUS_CHANGE",
    },
  };
}

/** Migrate legacy `invoice_notifications` array shape. */
export function legacyInvoiceRowsToInbox(parsed: unknown): InboxNotification[] {
  if (!Array.isArray(parsed)) return [];
  const out: InboxNotification[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const message = typeof r.message === "string" ? r.message : "";
    const timestamp = typeof r.timestamp === "string" ? r.timestamp : new Date().toISOString();
    const d = r.data as Record<string, unknown> | undefined;
    const username = d?.username != null ? String(d.username) : undefined;
    const invoiceId = d?.invoiceId != null ? Number(d.invoiceId) : undefined;
    out.push({
      id: newId(),
      category: d?.action === "PAID" ? "external_invoice" : "invoice",
      title: "Invoice",
      body: message || "Invoice notification",
      createdAt: timestamp,
      read: Boolean(r.read),
      source: "queue",
      channel: "legacy-localStorage",
      href: userHref(username),
      meta: {
        username,
        invoiceId: Number.isFinite(invoiceId) ? invoiceId : undefined,
        amount: d?.amount != null ? Number(d.amount) : undefined,
        dedupeKey: `legacy:${timestamp}:${message}`,
      },
    });
  }
  return out;
}
