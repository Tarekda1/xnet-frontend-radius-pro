import { useNotificationInboxStore } from "@/store/notificationInboxStore";

/** @deprecated Use `LEGACY_INVOICE_NOTIFICATIONS_KEY` from `@/store/notificationInboxStore` */
export const INVOICE_NOTIFICATIONS_STORAGE_KEY = "invoice_notifications";

/**
 * Live + persisted notification inbox (STOMP → Zustand).
 * Prefer `useNotificationInboxStore` directly when you need actions.
 */
export const useInvoiceNotifications = () => useNotificationInboxStore((s) => s.items);
