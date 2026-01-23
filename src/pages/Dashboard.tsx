import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  User as UserIcon
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

type AuditLogRow = {
  id: number;
  level: string;
  message: string;
  meta: any;
  timestamp: string;
};

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
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
  
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const onlineMetrics = useOnlineMetrics();
  const expenseMonthlyTotals = useExpenseMonthlyTotals();
  const authMetrics = useAuthMetrics(86400);

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

  const recentAudit = useMemo(() => {
    const rows = recentAuditQuery.data ?? [];
    return rows.map((e) => {
      const meta = (e as any)?.meta ?? {};
      const actor = meta?.actor?.username ?? "—";
      const targets = Array.isArray(meta?.targets) ? meta.targets : [];
      const primaryTarget = targets[0] ?? null;
      const action = String(e.message ?? "").replace(/^audit\./, "") || "—";
      const ts = e.timestamp ? new Date(e.timestamp) : null;
      return { id: e.id, actor, targets, primaryTarget, action, ts };
    });
  }, [recentAuditQuery.data]);

  // Extract data from hooks
  const [resellerBalance, setResellerBalance] = useState<number | null>(null);
  const [resellerUserCount, setResellerUserCount] = useState<number | null>(null);
  const [resellerOnlineCount, setResellerOnlineCount] = useState<number | null>(null);

  const totalOnlineUsers = isReseller ? (resellerOnlineCount ?? 0) : onlineMetrics.totalOnlineUsers;
  const totalActiveUsers = isReseller ? (resellerOnlineCount ?? 0) : onlineMetrics.totalActiveUsers;

  const now = new Date();
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
    <div className="w-full space-y-6 p-y-8 animate-in fade-in-50">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your system's performance and user activity."
        icon={Activity}
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="w-fit text-black" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            {canSeeAnalytics ? (
              <Button variant="outline" size="sm" className="text-black" asChild>
                <a href="/analytics">
                  <LineChart className="mr-2 h-4 w-4" />
                  View Analytics
                </a>
              </Button>
            ) : null}
            <Button variant="outline" size="icon" className="text-black">
              <Settings className="h-4 w-4" />
            </Button>
            {canSeeAlerts ? (
              <Button variant="outline" size="icon" className="text-black">
                <Bell className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2">
        {((!isReseller && canSeeOnline) || isReseller) ? (
          <Button variant="outline" size="sm" className="text-black" asChild>
            <Link to="/online-users">Open Live Sessions</Link>
          </Button>
        ) : null}
        {canAny(user, ["users.view", "reseller.users.view"]) ? (
          <Button variant="outline" size="sm" className="text-black" asChild>
            <Link to="/users/list">Open Users</Link>
          </Button>
        ) : null}
        {can(user, "radius.profiles.view") ? (
          <Button variant="outline" size="sm" className="text-black" asChild>
            <Link to="/profiles/list">Open Profiles</Link>
          </Button>
        ) : null}
        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          Tip: Press <span className="font-mono rounded border px-1.5 py-0.5 bg-white">Ctrl</span>+
          <span className="font-mono rounded border px-1.5 py-0.5 bg-white">K</span> to search commands
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
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

          {/* System Stats and Activity */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* System Health */}
            <Card className="md:col-span-4 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Real-time system metrics and performance indicators</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
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
              <Card className="md:col-span-3 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest admin and reseller actions</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => recentAuditQuery.refetch()}
                      disabled={recentAuditQuery.isFetching}
                      className="text-black"
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
                            <div className="text-sm font-medium truncate">{e.action}</div>
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
            <div className="col-span-full lg:col-span-3">
              <BandwidthWidget />
            </div>

            {/* Analytics Widget */}
            <div className="col-span-full lg:col-span-2">
              {canSeeAnalytics ? <AnalyticsWidget /> : null}
            </div>

            {/* Alert Notifications */}
            <div className="col-span-full lg:col-span-1">
              {canSeeAlerts ? <AlertNotification maxAlerts={5} /> : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;