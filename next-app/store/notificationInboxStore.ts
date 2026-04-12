import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InboxNotification } from "@/types/notifications";
import { legacyInvoiceRowsToInbox } from "@/lib/normalizeInboxNotification";

const MAX_ITEMS = 120;

/** Legacy key — migrated once into this store; safe to remove after upgrade. */
export const LEGACY_INVOICE_NOTIFICATIONS_KEY = "invoice_notifications";

type NotificationInboxState = {
  items: InboxNotification[];
  ingest: (item: InboxNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
};

function migrateLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LEGACY_INVOICE_NOTIFICATIONS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    const mapped = legacyInvoiceRowsToInbox(parsed);
    if (!mapped.length) {
      localStorage.removeItem(LEGACY_INVOICE_NOTIFICATIONS_KEY);
      return;
    }
    const { items, ingest } = useNotificationInboxStore.getState();
    if (items.length > 0) {
      localStorage.removeItem(LEGACY_INVOICE_NOTIFICATIONS_KEY);
      return;
    }
    for (const it of mapped.slice(0, MAX_ITEMS)) {
      ingest(it);
    }
    localStorage.removeItem(LEGACY_INVOICE_NOTIFICATIONS_KEY);
  } catch {
    /* ignore */
  }
}

export const useNotificationInboxStore = create<NotificationInboxState>()(
  persist(
    (set) => ({
      items: [],
      ingest: (item) =>
        set((state) => {
          const key = item.meta?.dedupeKey ?? item.id;
          if (state.items.some((i) => (i.meta?.dedupeKey ?? i.id) === key)) {
            return state;
          }
          return { items: [item, ...state.items].slice(0, MAX_ITEMS) };
        }),
      markRead: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })),
      markAllRead: () =>
        set((state) => ({
          items: state.items.map((i) => ({ ...i, read: true })),
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: "xnet-notification-inbox",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => () => {
        migrateLegacyLocalStorage();
      },
    }
  )
);

/** Non-hook entry for STOMP layer (avoid subscribing in multiple places). */
export function ingestInboxNotification(item: InboxNotification) {
  useNotificationInboxStore.getState().ingest(item);
}
