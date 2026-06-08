/** Unified inbox row (WebSocket + persisted). */
export type InboxNotificationCategory = "invoice" | "external_invoice" | "pay_due" | "user_status" | "system";

export interface InboxNotification {
  id: string;
  category: InboxNotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  source: "queue" | "topic";
  channel?: string;
  /** In-app path when applicable */
  href?: string;
  meta?: {
    invoiceId?: number;
    username?: string;
    amount?: number;
    /** For de-duplication across reconnects */
    dedupeKey?: string;
    rawType?: string;
  };
}

/** @deprecated Use InboxNotification — kept for any external imports */
export interface InvoiceNotification {
  message: string;
  timestamp: string;
  data: {
    invoiceId: number;
    username: string;
    amount?: number;
    action?: string;
  };
  read?: boolean;
}
