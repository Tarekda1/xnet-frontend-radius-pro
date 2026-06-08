import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ActivityTimeline from "@/components/ActivityTimeline";
import EmptyState from "@/components/EmptyState";
import { Bell, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";
import Link from "next/link";
import { useNotificationInboxStore } from "@/store/notificationInboxStore";
import type { InboxNotificationCategory } from "@/types/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Filter = "all" | InboxNotificationCategory;

function categoryLabel(c: InboxNotificationCategory): string {
  switch (c) {
    case "invoice":
      return "Invoice";
    case "external_invoice":
      return "External";
    case "pay_due":
      return "Pay due";
    case "user_status":
      return "User status";
    default:
      return "System";
  }
}

export default function NotificationsPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const canSeeAudit = canAny(user, ["users.view", "reseller.users.view"]);
  const items = useNotificationInboxStore((s) => s.items);
  const markRead = useNotificationInboxStore((s) => s.markRead);
  const markAllRead = useNotificationInboxStore((s) => s.markAllRead);
  const clearAll = useNotificationInboxStore((s) => s.clearAll);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="w-full space-y-8 py-5">
      <PageHeader
        title={t("notifications_title")}
        subtitle="Live feed from billing queue and user status topic. Pay-due reminders appear when you have permission to view external invoices. Stored locally in your browser."
        icon={Bell}
        actions={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {unread > 0 ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => markAllRead()}>
                Mark all read ({unread})
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="text-destructive border-destructive/40">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear inbox
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes every item from your inbox on this device. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => clearAll()}
                  >
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <section className="space-y-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All ({items.length})</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="external_invoice">External</TabsTrigger>
            <TabsTrigger value="pay_due">Pay due</TabsTrigger>
            <TabsTrigger value="user_status">Status</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title={t("notifications_empty")} description="Events will appear here when the WebSocket receives them." />
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {filtered.map((n) => (
              <li
                key={n.id}
                className={cn("px-4 py-3 text-sm", !n.read && "bg-muted/40")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {categoryLabel(n.category)}
                  </Badge>
                  {!n.read ? <span className="text-xs text-primary font-medium">Unread</span> : null}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {n.source === "queue" ? "Queue" : "Topic"}
                    {n.channel ? ` · ${n.channel}` : ""}
                  </span>
                </div>
                <p className="font-medium text-foreground mt-1">{n.title}</p>
                <p className="text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {n.href ? (
                    <Link
                      className="text-xs text-primary underline-offset-2 hover:underline"
                      href={n.href}
                      onClick={() => markRead(n.id)}
                    >
                      Open linked record
                    </Link>
                  ) : null}
                  {!n.read ? (
                    <button
                      type="button"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                      onClick={() => markRead(n.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canSeeAudit ? (
        <section>
          <ActivityTimeline limit={25} />
        </section>
      ) : null}
    </div>
  );
}
