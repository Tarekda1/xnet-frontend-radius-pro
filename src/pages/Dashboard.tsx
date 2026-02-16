import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseMonthlyTotals } from '@/hooks/useExpenses';
import { useAuthMetrics } from "@/hooks/useAuthMetrics";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  UserCheck, 
  Shield, 
  AlertTriangle, 
  Activity, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  CircuitBoard,
  HardDrive,
  MoreHorizontal,
  Bell,
  Settings,
  LineChart,
  Receipt,
  Clock,
  User as UserIcon,
  Server
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
 
import AnalyticsWidget from '@/components/AnalyticsWidget';
import AlertNotification from '@/components/AlertNotification';
import BandwidthWidget from '@/components/BandwidthWidget';
import { useAlerts } from '@/hooks/useAlerts';
import CollectedSummaryCards from '@/components/CollectedSummaryCards';
import { useAuth } from '@/context/AuthContext';
import { can, canAny } from '@/lib/permissions';
import { fetchResellerMe } from '@/api/resellers';
import { apiClient } from '@/api/client';
import { Link } from "react-router-dom";
import { QuotaExceededSummaryAlert } from "@/components/ui/Alert";
import useNas from "@/hooks/useNas";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { Line as RechartsLine, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AuditLogRow = {
  id: number;
  level: string;
  message: string;
  meta: any;
  timestamp: string;
};
type NocHealthSample = {
  key: string;
  time: string;
  dbLatencyMs: number;
  serverProcessingMs: number;
  clientRttMs: number;
};

function formatAuditTitle(action: string, meta: any): { title: string; detail?: string } {
  const a = String(action || "");
  const m = meta ?? {};

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

  // Optional detail for common actions
  if (a === "users.update") {
    const ch = (m as any)?.changed ?? {};
    const status = ch?.accountStatus;
    if (status?.from && status?.to && status.from !== status.to) {
      return { title: status.to === "suspended" ? "Suspend user" : status.to === "active" ? "Activate user" : pretty, detail: `${status.from} → ${status.to}` };
    }
    const prof = ch?.profileId;
    if (prof?.from && prof?.to && prof.from !== prof.to) {
      return { title: "Change profile", detail: `#${prof.from} → #${prof.to}` };
    }
  }

  if (a === "users.bulk.setStatus") {
    const s = String((m as any)?.accountStatus ?? "");
    if (s) return { title: s === "suspended" ? "Bulk suspend users" : s === "active" ? "Bulk activate users" : pretty, detail: s };
  }

  return { title: pretty };
}

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showQuotaExceeded, setShowQuotaExceeded] = useState(true);
  const [selectedRejectBucket, setSelectedRejectBucket] = useState<string | null>(null);
  const [rejectTrendWindowHours, setRejectTrendWindowHours] = useState<6 | 12 | 24>(24);
  const [nocHealthTrend, setNocHealthTrend] = useState<NocHealthSample[]>([]);
  const [rejectAlertThreshold, setRejectAlertThreshold] = useState<number>(() => {
    const raw = localStorage.getItem("dashboard.noc.rejectAlertThreshold");
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return 15;
    return Math.min(Math.max(Math.round(parsed), 1), 100);
  });
  const [rejectAlertMutedUntil, setRejectAlertMutedUntil] = useState<number>(0);
  const { user } = useAuth();
  const isReseller = user?.role === 'reseller';
  const canSeeOnline = can(user, 'users.online.view');
  const canSeeExpenses = can(user, 'admin.expenses.view');
  const canSeeAlerts = can(user, 'admin.alerts.view');
  const canSeeAnalytics = can(user, 'admin.analytics.view');
  const canSeeTotals = can(user, 'dashboard.widget.totalAmount');
  const canSeeInvoiceCounts = can(user, 'dashboard.widget.invoiceCounts');
  const canSeeCollections = can(user, 'billing.collections.view');
  const canSeeAudit = canAny(user, ['users.view', 'reseller.users.view']);
  const canSeeQuotaExceeded = canAny(user, ['users.view', 'reseller.users.view']);
  
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const onlineMetrics = useOnlineMetrics();
  const expenseMonthlyTotals = useExpenseMonthlyTotals();
  const authMetrics = useAuthMetrics(86400);
  const nasQuery = useNas(1, 1);
  const onlineWatchlistQuery = useOnlineUsers("", 1, 5, {
    enabled: (!isReseller && canSeeOnline) || isReseller,
    refetchInterval: 15000,
  });
  const nocSnapshotQuery = useQuery({
    queryKey: ["noc-snapshot"],
    queryFn: async () => {
      const resp = await apiClient.get("/noc-snapshot");
      return (resp?.data?.data ?? {
        generatedAt: null,
        authRejectTrend: [],
        topNasBySessions: [],
      }) as {
        generatedAt: string | null;
        authRejectTrend: Array<{ bucket: string; attempts: number; rejected: number; rejectRate: number }>;
        topNasBySessions: Array<{ nasIp: string; nasLabel: string; sessions: number }>;
      };
    },
    enabled: (!isReseller && canSeeOnline) || isReseller,
    refetchInterval: 30000,
  });
  const nocHealthQuery = useQuery({
    queryKey: ["noc-health"],
    queryFn: async () => {
      const started = performance.now();
      const resp = await apiClient.get("/noc-health");
      const clientRttMs = Math.max(0, Math.round(performance.now() - started));
      const payload = (resp?.data?.data ?? {
        generatedAt: null,
        dbLatencyMs: 0,
        serverProcessingMs: 0,
        activeSessions: 0,
      }) as {
        generatedAt: string | null;
        dbLatencyMs: number;
        serverProcessingMs: number;
        activeSessions: number;
      };
      return {
        ...payload,
        clientRttMs,
      };
    },
    enabled: (!isReseller && canSeeOnline) || isReseller,
    refetchInterval: 30000,
  });

  const recentAuditQuery = useQuery({
    queryKey: ["audit", "recent"],
    queryFn: async () => {
      const resp = await apiClient.get("/audit", { params: { limit: 8 } });
      const rows = (resp?.data?.data ?? []) as AuditLogRow[];
      return Array.isArray(rows) ? rows : [];
    },
    enabled: Boolean(canSeeAudit) && !isLoading,
    refetchInterval: 30000,
  });

  const quotaExceededQuery = useQuery({
    queryKey: ["users", "quota-exceeded"],
    queryFn: async () => {
      const resp = await apiClient.get("/radius/users/quota-exceeded");
      return resp?.data?.data as {
        totalUsers: number;
        monthlyCount: number;
        dailyCount: number;
      };
    },
    enabled: Boolean(canSeeQuotaExceeded) && !isLoading,
    refetchInterval: 60000,
  });

  const recentAudit = useMemo(() => {
    const rows = recentAuditQuery.data ?? [];
    return rows.map((e) => {
      const meta = (e as any)?.meta ?? {};
      const actor = meta?.actor?.username ?? "—";
      const targets = Array.isArray(meta?.targets) ? meta.targets : [];
      const primaryTarget = targets[0] ?? null;
      const action = String(e.message ?? "").replace(/^audit\./, "") || "—";
      const ts = e.timestamp ? new Date(e.timestamp) : null;
      const fmt = formatAuditTitle(action, meta);
      return { id: e.id, actor, targets, primaryTarget, action, title: fmt.title, detail: fmt.detail, ts };
    });
  }, [recentAuditQuery.data]);

  const authAttempts = authMetrics.data?.current.attempts ?? 0;
  const authAccepted = authMetrics.data?.current.accepted ?? 0;
  const authRejected = authMetrics.data?.current.rejected ?? 0;
  const authSuccessRate = authAttempts > 0 ? (authAccepted / authAttempts) * 100 : 0;
  const authRejectRate = authAttempts > 0 ? (authRejected / authAttempts) * 100 : 0;
  const authHealthLabel =
    authRejectRate <= 5 ? "Healthy" : authRejectRate <= 15 ? "Warning" : "Critical";
  const authHealthBadgeClass =
    authHealthLabel === "Healthy"
      ? "text-green-700 bg-green-50 border-green-200"
      : authHealthLabel === "Warning"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";
  const isRejectThresholdBreached = authAttempts >= 20 && authRejectRate >= rejectAlertThreshold;
  const isRejectAlertMuted = Date.now() < rejectAlertMutedUntil;
  const showRejectThresholdAlert = isRejectThresholdBreached && !isRejectAlertMuted;
  const totalNas = nasQuery.data?.data?.totalEntries ?? 0;
  const watchlistRows = onlineWatchlistQuery.data?.data ?? [];
  const rejectTrendData = (nocSnapshotQuery.data?.authRejectTrend ?? []).map((r) => ({
    bucket: r.bucket,
    time: String(r.bucket || "").slice(11, 16),
    attempts: Number(r.attempts ?? 0),
    rejected: Number(r.rejected ?? 0),
    rejectRate: Number(r.rejectRate ?? 0),
  }));
  const rejectTrendDisplayData = useMemo(() => {
    if (!rejectTrendData.length) return [];
    if (rejectTrendWindowHours >= 24) return rejectTrendData;
    const last = rejectTrendData[rejectTrendData.length - 1];
    const lastAt = new Date(String(last.bucket || "").replace(" ", "T"));
    if (!Number.isFinite(lastAt.getTime())) return rejectTrendData;
    const from = new Date(lastAt.getTime() - rejectTrendWindowHours * 60 * 60 * 1000);
    return rejectTrendData.filter((d) => {
      const t = new Date(String(d.bucket || "").replace(" ", "T"));
      return Number.isFinite(t.getTime()) && t >= from;
    });
  }, [rejectTrendData, rejectTrendWindowHours]);
  const rejectWindowStats = useMemo(() => {
    const attempts = rejectTrendDisplayData.reduce((acc, d) => acc + Number(d.attempts || 0), 0);
    const rejected = rejectTrendDisplayData.reduce((acc, d) => acc + Number(d.rejected || 0), 0);
    const avgRate = attempts > 0 ? (rejected / attempts) * 100 : 0;
    return { attempts, rejected, avgRate };
  }, [rejectTrendDisplayData]);
  const topNasBySessions = nocSnapshotQuery.data?.topNasBySessions ?? [];
  const nocHealth = nocHealthQuery.data ?? {
    generatedAt: null,
    dbLatencyMs: 0,
    serverProcessingMs: 0,
    activeSessions: 0,
    clientRttMs: 0,
  };
  const healthState = nocHealthQuery.isError
    ? "Down"
    : nocHealth.dbLatencyMs <= 120 && nocHealth.serverProcessingMs <= 200 && nocHealth.clientRttMs <= 800
      ? "Healthy"
      : nocHealth.dbLatencyMs <= 400 && nocHealth.serverProcessingMs <= 800 && nocHealth.clientRttMs <= 2000
        ? "Warning"
        : "Critical";
  const healthBadgeClass =
    healthState === "Healthy"
      ? "text-green-700 bg-green-50 border-green-200"
      : healthState === "Warning"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";
  const degradedHealthSamples = useMemo(() => {
    return nocHealthTrend.filter(
      (s) => s.dbLatencyMs > 400 || s.serverProcessingMs > 800 || s.clientRttMs > 2000
    ).length;
  }, [nocHealthTrend]);
  const selectedRange = useMemo(() => {
    if (!selectedRejectBucket) return null;
    const from = new Date(String(selectedRejectBucket).replace(" ", "T"));
    if (!Number.isFinite(from.getTime())) return null;
    const to = new Date(from.getTime() + 60 * 60 * 1000);
    return { from, to };
  }, [selectedRejectBucket]);
  const authFailuresPageHref = useMemo(() => {
    if (!selectedRange) return "/auth-failures";
    const params = new URLSearchParams({
      from: selectedRange.from.toISOString().slice(0, 16),
      to: selectedRange.to.toISOString().slice(0, 16),
    });
    return `/auth-failures?${params.toString()}`;
  }, [selectedRange]);
  const authFailuresLastHourHref = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 60 * 60 * 1000);
    const params = new URLSearchParams({
      from: from.toISOString().slice(0, 16),
      to: now.toISOString().slice(0, 16),
      status: "rejected",
    });
    return `/auth-failures?${params.toString()}`;
  }, []);
  const authFailuresQuery = useQuery({
    queryKey: ["auth-failures", selectedRejectBucket],
    queryFn: async () => {
      if (!selectedRange) return { rows: [] as Array<{ id: number; timestamp: string; username: string | null; nasIp: string | null; macAddress: string | null; status: string | null }> };
      const resp = await apiClient.get("/auth-failures", {
        params: {
          from: selectedRange.from.toISOString(),
          to: selectedRange.to.toISOString(),
          limit: 300,
        },
      });
      return (resp?.data?.data ?? { rows: [] }) as {
        rows: Array<{ id: number; timestamp: string; username: string | null; nasIp: string | null; macAddress: string | null; status: string | null }>;
      };
    },
    enabled: Boolean(selectedRange),
  });

  // Extract data from hooks
  const [resellerBalance, setResellerBalance] = useState<number | null>(null);
  const [resellerUserCount, setResellerUserCount] = useState<number | null>(null);
  const [resellerOnlineCount, setResellerOnlineCount] = useState<number | null>(null);

  const totalOnlineUsers = isReseller ? (resellerOnlineCount ?? 0) : onlineMetrics.totalOnlineUsers;
  const totalActiveUsers = isReseller ? (resellerOnlineCount ?? 0) : onlineMetrics.totalActiveUsers;

  const now = new Date();
  const todayLabel = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  const mt = expenseMonthlyTotals.data?.data || [];
  const thisMonth = mt.find((m) => m.month === thisMonthKey);
  const prevMonth = mt.find((m) => m.month === prevMonthKey);
  const spendThis = thisMonth?.totalAmount ?? 0;
  const spendPrev = prevMonth?.totalAmount ?? 0;
  const spendCurrency = thisMonth?.currency || mt[0]?.currency || 'USD';
  const spendGrowth = spendPrev > 0 ? ((spendThis - spendPrev) / spendPrev) * 100 : (spendThis > 0 ? 100 : 0);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const value = Math.min(Math.max(Math.round(Number(rejectAlertThreshold) || 15), 1), 100);
    localStorage.setItem("dashboard.noc.rejectAlertThreshold", String(value));
  }, [rejectAlertThreshold]);

  useEffect(() => {
    if (!nocHealth.generatedAt) return;
    const generatedAt = nocHealth.generatedAt;
    const key = `${generatedAt}-${nocHealth.dbLatencyMs}-${nocHealth.serverProcessingMs}-${nocHealth.clientRttMs}`;
    setNocHealthTrend((prev) => {
      if (prev.some((p) => p.key === key)) return prev;
      const t = new Date(generatedAt);
      const time = Number.isFinite(t.getTime()) ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
      const next: NocHealthSample = {
        key,
        time,
        dbLatencyMs: Number(nocHealth.dbLatencyMs ?? 0),
        serverProcessingMs: Number(nocHealth.serverProcessingMs ?? 0),
        clientRttMs: Number(nocHealth.clientRttMs ?? 0),
      };
      return [...prev.slice(-23), next];
    });
  }, [nocHealth.generatedAt, nocHealth.dbLatencyMs, nocHealth.serverProcessingMs, nocHealth.clientRttMs]);

  // Reseller dashboard data: balance + scoped counts
  useEffect(() => {
    let cancelled = false;
    if (!isReseller) return;

    (async () => {
      try {
        const me = await fetchResellerMe();
        if (cancelled) return;
        setResellerBalance(Number(me.balance ?? 0));
      } catch {
        // ignore; backend will enforce anyway
      }

      try {
        const resp = await apiClient.get('/radius/users', { params: { page: 1, pageSize: 1 } });
        const total = resp?.data?.data?.totalUsers ?? resp?.data?.data?.total ?? 0;
        if (cancelled) return;
        setResellerUserCount(Number(total) || 0);
      } catch {
        // ignore
      }

      try {
        const resp = await apiClient.get('/online-users-metrics');
        if (cancelled) return;
        const d = resp?.data?.data;
        const n = Number(d?.totalOnlineUsers ?? 0);
        setResellerOnlineCount(Number.isFinite(n) ? n : 0);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReseller]);

  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate refresh loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const LoadingSkeleton = () => (
    <>
      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-8 w-[60px] mb-2" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <Skeleton className="h-6 w-[60px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Skeleton */}
      <div className="grid w-full min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-[120px] mb-2" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Skeleton */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-[120px] mb-2" />
                <Skeleton className="h-4 w-[180px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div className="w-full space-y-6 px-4 py-6 sm:px-0 animate-in fade-in-50">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your system's performance and user activity."
        icon={Activity}
        actions={(
          <div className="flex w-full flex-col gap-2 md:w-auto">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-black sm:w-auto"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              {canSeeAnalytics ? (
                <Button variant="outline" size="sm" className="w-full justify-center text-black sm:w-auto" asChild>
                  <a href="/analytics">
                    <LineChart className="mr-2 h-4 w-4" />
                    View Analytics
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="flex w-full justify-center gap-2 sm:justify-end">
              <Button variant="outline" size="icon" className="text-black !h-9 !w-9 !px-0">
                <Settings className="h-4 w-4" />
              </Button>
              {canSeeAlerts ? (
                <Button variant="outline" size="icon" className="text-black !h-9 !w-9 !px-0">
                  <Bell className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        )}
      />

      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
        {((!isReseller && canSeeOnline) || isReseller) ? (
          <Button variant="outline" size="sm" className="w-full text-black lg:w-auto" asChild>
            <Link to="/online-users">Open Live Sessions</Link>
          </Button>
        ) : null}
        {canAny(user, ["users.view", "reseller.users.view"]) ? (
          <Button variant="outline" size="sm" className="w-full text-black lg:w-auto" asChild>
            <Link to="/users/list">Open Users</Link>
          </Button>
        ) : null}
        {can(user, "radius.profiles.view") ? (
          <Button variant="outline" size="sm" className="w-full text-black lg:w-auto sm:col-span-2 lg:col-span-1" asChild>
            <Link to="/profiles/list">Open Profiles</Link>
          </Button>
        ) : null}
        <div className="hidden md:flex md:ml-auto text-xs text-muted-foreground items-center gap-1">
          Tip: Press <span className="font-mono rounded border px-1.5 py-0.5 bg-background">Ctrl</span>+
          <span className="font-mono rounded border px-1.5 py-0.5 bg-background">K</span> to search commands
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {canSeeQuotaExceeded && showQuotaExceeded ? (
            (quotaExceededQuery.data?.monthlyCount || 0) + (quotaExceededQuery.data?.dailyCount || 0) > 0 ? (
              <QuotaExceededSummaryAlert
                monthLabel={thisMonthKey}
                dayLabel={todayLabel}
                monthlyCount={quotaExceededQuery.data?.monthlyCount ?? 0}
                dailyCount={quotaExceededQuery.data?.dailyCount ?? 0}
                totalUsers={quotaExceededQuery.data?.totalUsers}
                onClose={() => setShowQuotaExceeded(false)}
                className="rounded-md"
              />
            ) : null
          ) : null}

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Reseller balance */}
            {isReseller ? (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <Receipt className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {resellerBalance === null ? '…' : resellerBalance.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Reseller wallet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Reseller users */}
            {isReseller ? (
              <Link to="/users/list" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {resellerUserCount === null ? '…' : resellerUserCount}
                      </div>
                      <p className="text-xs text-muted-foreground">Owned users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ) : null}

            {/* Live Sessions Card */}
            {(!isReseller && canSeeOnline) || isReseller ? (
            <Link to="/online-users" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{totalOnlineUsers}</div>
                    <p className="text-xs text-muted-foreground">Real-time data</p>
                  </div>
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <Activity className="h-3 w-3" />
                    Live
                  </Badge>
                </div>
              </CardContent>
            </Card>
            </Link>
            ) : null}

            {/* Active Users Card */}
            {(!isReseller && canSeeOnline) || isReseller ? (
            <Link to="/users/list" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{totalActiveUsers}</div>
                    <p className="text-xs text-muted-foreground">Real-time data</p>
                  </div>
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    +5%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            </Link>
            ) : null}

            {/* Expenses This Month */}
            {canSeeExpenses && canSeeTotals ? (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses (This Month)</CardTitle>
                <Receipt className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {expenseMonthlyTotals.isLoading ? '...' : `${spendThis.toFixed(2)} ${spendCurrency}`}
                    </div>
                    <p className="text-xs text-muted-foreground">{thisMonthKey}</p>
                  </div>
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    {spendGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    {Math.abs(spendGrowth).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            ) : null}

            {/* Auth Requests Card */}
            {canSeeInvoiceCounts ? (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auth Requests</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {authMetrics.isLoading
                        ? "..."
                        : new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
                            authMetrics.data?.current.attempts ?? 0
                          )}
                    </div>
                    <p className="text-xs text-muted-foreground">Past 24 hours</p>
                  </div>
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    {(authMetrics.data?.changePct.attempts ?? 0) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    {Math.abs(authMetrics.data?.changePct.attempts ?? 0).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            ) : null}

            {/* Collected Summary Cards */}
            {canSeeCollections ? <CollectedSummaryCards /> : null}

            {/* Failed Attempts Card */}
            {canSeeAlerts ? (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {alertsLoading ? '...' : (alerts && Array.isArray(alerts) ? alerts.filter(a => !a.resolved).length : 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alerts && Array.isArray(alerts) ? alerts.filter(a => !a.acknowledged && !a.resolved).length : 0} unacknowledged
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                    +3%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            ) : null}
          </div>

          {/* NOC Snapshot */}
          {((!isReseller && canSeeOnline) || isReseller) ? (
            <div className="grid gap-4 lg:grid-cols-7">
              <Card className="lg:col-span-4 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle>NOC Snapshot (24h)</CardTitle>
                      <CardDescription>Core operations indicators for authentication and service quality</CardDescription>
                    </div>
                    <Badge variant="outline" className={authHealthBadgeClass}>
                      {authHealthLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                    <div className="text-xs text-muted-foreground">Reject alert threshold</div>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={rejectAlertThreshold}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (!Number.isFinite(next)) return;
                        setRejectAlertThreshold(Math.min(Math.max(Math.round(next), 1), 100));
                      }}
                      className="h-8 w-24"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    {isRejectThresholdBreached ? (
                      <Badge variant="destructive">Threshold breached</Badge>
                    ) : (
                      <Badge variant="secondary">Within threshold</Badge>
                    )}
                  </div>
                  {showRejectThresholdAlert ? (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="text-sm text-red-700">
                        Reject rate is <span className="font-semibold">{authRejectRate.toFixed(1)}%</span> (threshold {rejectAlertThreshold}%).
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={authFailuresLastHourHref}>Open failed auths</Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setRejectAlertMutedUntil(Date.now() + 30 * 60 * 1000)}>
                          Mute 30m
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Auth Success Rate</div>
                      <div className="mt-1 text-2xl font-semibold text-green-600">{authSuccessRate.toFixed(1)}%</div>
                      <div className="mt-1 text-xs text-muted-foreground">{authAccepted} accepted of {authAttempts} attempts</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Auth Reject Rate</div>
                      <div className="mt-1 text-2xl font-semibold text-red-600">{authRejectRate.toFixed(1)}%</div>
                      <div className="mt-1 text-xs text-muted-foreground">{authRejected} rejected requests</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Users in FUP</div>
                      <div className="mt-1 text-2xl font-semibold text-amber-600">
                        {(quotaExceededQuery.data?.dailyCount ?? 0) + (quotaExceededQuery.data?.monthlyCount ?? 0)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {quotaExceededQuery.data?.dailyCount ?? 0} daily / {quotaExceededQuery.data?.monthlyCount ?? 0} monthly
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">NAS Devices</div>
                      <div className="mt-1 text-2xl font-semibold text-blue-600">{totalNas}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Configured NAS entries</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Reject Rate Trend</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {rejectTrendDisplayData.length ? `${rejectTrendDisplayData.length} points` : "No data"}
                        </div>
                        <Select
                          value={String(rejectTrendWindowHours)}
                          onValueChange={(v) => {
                            const n = Number(v);
                            if (n === 6 || n === 12 || n === 24) setRejectTrendWindowHours(n);
                          }}
                        >
                          <SelectTrigger className="h-7 w-[92px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="6">Last 6h</SelectItem>
                            <SelectItem value="12">Last 12h</SelectItem>
                            <SelectItem value="24">Last 24h</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mb-2 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded border p-1.5">
                        <div className="text-muted-foreground">Attempts</div>
                        <div className="font-semibold">{rejectWindowStats.attempts}</div>
                      </div>
                      <div className="rounded border p-1.5">
                        <div className="text-muted-foreground">Rejected</div>
                        <div className="font-semibold">{rejectWindowStats.rejected}</div>
                      </div>
                      <div className="rounded border p-1.5">
                        <div className="text-muted-foreground">Avg reject</div>
                        <div className="font-semibold">{rejectWindowStats.avgRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="h-28 w-full">
                      {rejectTrendDisplayData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={rejectTrendDisplayData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                            <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={20} />
                            <YAxis tick={{ fontSize: 10 }} width={28} domain={[0, 100]} />
                            <RechartsTooltip
                              formatter={(value: number, _name: string, item: any) => {
                                const attempts = Number(item?.payload?.attempts ?? 0);
                                const rejected = Number(item?.payload?.rejected ?? 0);
                                return [`${Number(value).toFixed(1)}%`, `Reject rate (${rejected}/${attempts})`];
                              }}
                            />
                            <RechartsLine
                              type="monotone"
                              dataKey="rejectRate"
                              stroke="#dc2626"
                              strokeWidth={2}
                              dot={{ r: 2 }}
                              activeDot={{
                                r: 5,
                                onClick: (_event: any, payload: any) => {
                                  const bucket = payload?.payload?.bucket;
                                  if (bucket) setSelectedRejectBucket(String(bucket));
                                },
                                style: { cursor: "pointer" },
                              }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Not enough auth history yet
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Live Session Watchlist</CardTitle>
                      <CardDescription>Latest active sessions for quick triage</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onlineWatchlistQuery.refetch()}
                      disabled={onlineWatchlistQuery.isFetching}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${onlineWatchlistQuery.isFetching ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {onlineWatchlistQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, idx) => (
                        <Skeleton key={idx} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : watchlistRows.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No live sessions available.</div>
                  ) : (
                    <div className="space-y-2">
                      {watchlistRows.map((row) => (
                        <div key={`${row.session_username}-${row.session_mac_address}`} className="flex items-center justify-between rounded-lg border p-2.5">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{row.session_username}</div>
                            <div className="truncate text-xs text-muted-foreground">{row.profile_profile_name || "No profile"}</div>
                          </div>
                          <Badge variant={row.is_fallback ? "destructive" : "secondary"}>
                            {row.is_fallback ? "FUP" : "Normal"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="my-3 border-t" />
                  <div className="mb-3 rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">API Health</div>
                      <Badge variant="outline" className={healthBadgeClass}>{healthState}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">DB latency</div>
                        <div className="font-semibold">{Math.round(Number(nocHealth.dbLatencyMs ?? 0))} ms</div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">Server processing</div>
                        <div className="font-semibold">{Math.round(Number(nocHealth.serverProcessingMs ?? 0))} ms</div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">Client RTT</div>
                        <div className="font-semibold">{Math.round(Number(nocHealth.clientRttMs ?? 0))} ms</div>
                      </div>
                      <div className="rounded border p-2">
                        <div className="text-muted-foreground">Active sessions</div>
                        <div className="font-semibold">{Number(nocHealth.activeSessions ?? 0)}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Server className="h-3.5 w-3.5" />
                        {nocHealthQuery.isFetching ? "Refreshing..." : "Auto-refresh 30s"}
                      </div>
                      <div>
                        {nocHealth.generatedAt ? `Updated ${new Date(nocHealth.generatedAt).toLocaleTimeString()}` : "No sample yet"}
                      </div>
                    </div>
                    <div className="mt-3 rounded border p-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Latency trend ({nocHealthTrend.length} samples)</span>
                        <span>{degradedHealthSamples} degraded</span>
                      </div>
                      <div className="h-20 w-full">
                        {nocHealthTrend.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsLineChart data={nocHealthTrend} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                              <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={16} />
                              <YAxis tick={{ fontSize: 10 }} width={26} />
                              <RechartsTooltip />
                              <RechartsLine type="monotone" dataKey="dbLatencyMs" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                              <RechartsLine type="monotone" dataKey="serverProcessingMs" stroke="#0284c7" strokeWidth={1.5} dot={false} />
                              <RechartsLine type="monotone" dataKey="clientRttMs" stroke="#dc2626" strokeWidth={1.5} dot={false} />
                            </RechartsLineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">Collecting samples...</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Top NAS by Active Sessions</div>
                    <Button variant="ghost" size="sm" onClick={() => nocSnapshotQuery.refetch()} disabled={nocSnapshotQuery.isFetching}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${nocSnapshotQuery.isFetching ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                  {!topNasBySessions.length ? (
                    <div className="text-sm text-muted-foreground">No NAS session data available.</div>
                  ) : (
                    <div className="space-y-2">
                      {topNasBySessions.map((nas) => (
                        <Link
                          key={`${nas.nasIp}-${nas.nasLabel}`}
                          to={`/online-users?search=${encodeURIComponent(nas.nasIp)}`}
                          className="block rounded-lg border p-2.5 hover:bg-slate-50 transition-colors"
                          title="Open live sessions filtered by this NAS"
                        >
                          <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{nas.nasLabel || nas.nasIp}</div>
                            <div className="truncate text-xs text-muted-foreground">{nas.nasIp}</div>
                          </div>
                          <Badge variant="secondary">{nas.sessions} sessions</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Reject-rate drilldown dialog */}
          <Dialog open={Boolean(selectedRejectBucket)} onOpenChange={(open) => (open ? null : setSelectedRejectBucket(null))}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <DialogTitle>
                    Failed Auth Attempts
                    {selectedRange ? ` (${selectedRange.from.toLocaleString()} - ${selectedRange.to.toLocaleTimeString()})` : ""}
                  </DialogTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link to={authFailuresPageHref}>Open full page</Link>
                  </Button>
                </div>
              </DialogHeader>
              {authFailuresQuery.isLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : !authFailuresQuery.data?.rows?.length ? (
                <div className="text-sm text-muted-foreground">No failed auth rows found for this hour.</div>
              ) : (
                <div className="max-h-[420px] overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr className="text-left">
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">NAS</th>
                        <th className="px-3 py-2">MAC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {authFailuresQuery.data.rows.map((r) => (
                        <tr key={String(r.id)} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap">{r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</td>
                          <td className="px-3 py-2">{r.username || "-"}</td>
                          <td className="px-3 py-2">
                            <Badge variant="destructive">{r.status || "failed"}</Badge>
                          </td>
                          <td className="px-3 py-2">{r.nasIp || "-"}</td>
                          <td className="px-3 py-2">{r.macAddress || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* System Stats and Activity */}
          <div className="grid w-full min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* System Health */}
            <Card className="w-full min-w-0 md:col-span-4 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Real-time system metrics and performance indicators</CardDescription>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1">
                      <Activity className="h-3 w-3 text-green-500" />
                      All Systems Operational
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <TooltipProvider>
                  {/* CPU Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">CPU Usage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">45%</span>
                        <Badge variant="secondary" className="text-xs">Normal</Badge>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500 animate-pulse" 
                            style={{ width: '45%' }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>CPU Usage: 45% - Within normal operating range</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Memory Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CircuitBoard className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Memory Usage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">60%</span>
                        <Badge variant="secondary" className="text-xs">Moderate</Badge>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full transition-all duration-500 animate-pulse" 
                            style={{ width: '60%' }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Memory Usage: 60% - Moderate load, monitoring recommended</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Disk Space */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Disk Space</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">25%</span>
                        <Badge variant="secondary" className="text-xs">Optimal</Badge>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 rounded-full transition-all duration-500 animate-pulse" 
                            style={{ width: '25%' }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Disk Usage: 25% - Optimal storage capacity</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {canSeeAudit ? (
              <Card className="w-full min-w-0 md:col-span-3 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest admin and reseller actions</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => recentAuditQuery.refetch()}
                      disabled={recentAuditQuery.isFetching}
                      className="w-full justify-center text-black sm:w-auto"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${recentAuditQuery.isFetching ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentAuditQuery.isLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-[220px]" />
                            <Skeleton className="h-3 w-[140px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentAuditQuery.error ? (
                    <div className="text-sm text-red-600">Failed to load activity.</div>
                  ) : recentAudit.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No recent activity.</div>
                  ) : (
                    <div className="space-y-3">
                      {recentAudit.map((e) => (
                        <div key={String(e.id)} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors">
                          <div className="mt-0.5 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{e.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              Actor: {e.actor}
                              {e.primaryTarget ? (
                                <>
                                  {" • "}
                                  Target:{" "}
                                  <a className="underline" href={`/users/${encodeURIComponent(String(e.primaryTarget))}`}>
                                    {String(e.primaryTarget)}
                                  </a>
                                </>
                              ) : null}
                              {e.detail ? (
                                <>
                                  {" • "}
                                  {e.detail}
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5" />
                            {e.ts ? e.ts.toLocaleTimeString() : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Bandwidth Widget */}
            <div className="col-span-full w-full min-w-0 lg:col-span-3">
              <BandwidthWidget />
            </div>

            {/* Analytics Widget */}
            <div className="col-span-full w-full min-w-0 lg:col-span-2">
              {canSeeAnalytics ? <AnalyticsWidget /> : null}
            </div>

            {/* Alert Notifications */}
            <div className="col-span-full w-full min-w-0 lg:col-span-1">
              {canSeeAlerts ? <AlertNotification maxAlerts={5} /> : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;