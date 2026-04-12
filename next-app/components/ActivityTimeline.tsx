import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type AuditLogRow = {
  id: number;
  level?: string;
  message: string;
  meta: unknown;
  timestamp: string;
};

function formatAuditTitle(action: string, meta: unknown): { title: string; detail?: string } {
  const a = String(action || "");
  const m = (meta ?? {}) as Record<string, unknown>;

  const pretty =
    a === "users.resetMac"
      ? "Reset MAC"
      : a === "users.resetDailyQuota"
        ? "Reset daily quota"
        : a === "users.resetMonthlyQuota"
          ? "Reset monthly traffic"
          : a === "users.bulk.resetMac"
            ? "Bulk reset MAC"
            : a === "users.bulk.setStatus"
              ? "Bulk set user status"
              : a === "users.update"
                ? "Update user"
                : a === "users.create"
                  ? "Create user"
                  : a === "users.delete"
                    ? "Delete user"
                    : a || "Activity";

  if (a === "users.update") {
    const ch = (m as { changed?: { accountStatus?: { from?: string; to?: string }; profileId?: { from?: number; to?: number } } })
      .changed ?? {};
    const status = ch.accountStatus;
    if (status?.from && status?.to && status.from !== status.to) {
      return {
        title:
          status.to === "suspended"
            ? "Suspend user"
            : status.to === "active"
              ? "Activate user"
              : pretty,
        detail: `${status.from} → ${status.to}`,
      };
    }
    const prof = ch.profileId;
    if (prof?.from != null && prof?.to != null && prof.from !== prof.to) {
      return { title: "Change profile", detail: `#${prof.from} → #${prof.to}` };
    }
  }

  if (a === "users.bulk.setStatus") {
    const s = String((m as { accountStatus?: string }).accountStatus ?? "");
    if (s) return { title: s === "suspended" ? "Bulk suspend users" : s === "active" ? "Bulk activate users" : pretty, detail: s };
  }

  return { title: pretty };
}

type Props = {
  limit?: number;
  enabled?: boolean;
};

export default function ActivityTimeline({ limit = 20, enabled = true }: Props) {
  const { t } = useTranslation("common");

  const q = useQuery({
    queryKey: ["audit", "timeline", limit],
    queryFn: async () => {
      const resp = await apiClient.get("/audit", { params: { limit } });
      const rows = (resp?.data?.data ?? []) as AuditLogRow[];
      return Array.isArray(rows) ? rows : [];
    },
    enabled,
    staleTime: 20_000,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const rows = q.data ?? [];
  if (rows.length === 0) {
    return <EmptyState icon={History} title={t("activity_empty")} />;
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t("activity_title")}</h3>
      </div>
      <ul className="divide-y max-h-[420px] overflow-y-auto">
        {rows.map((row) => {
          const action = String(row.message ?? "").replace(/^audit\./, "") || "—";
          const { title, detail } = formatAuditTitle(action, row.meta);
          const ago = (() => {
            try {
              return formatDistanceToNow(new Date(row.timestamp), { addSuffix: true });
            } catch {
              return row.timestamp;
            }
          })();
          return (
            <li key={row.id} className="flex gap-3 px-4 py-3 text-sm">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/70" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{title}</div>
                {detail ? <div className="text-xs text-muted-foreground">{detail}</div> : null}
                <div className="text-xs text-muted-foreground mt-1">{ago}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
