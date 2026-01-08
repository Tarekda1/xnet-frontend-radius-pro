import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';
import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseMonthlyTotals } from '@/hooks/useExpenses';
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
  Receipt
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

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const onlineMetrics = useOnlineMetrics();
  const expenseMonthlyTotals = useExpenseMonthlyTotals();

  // Extract data from hooks
  const totalOnlineUsers = onlineMetrics.totalOnlineUsers;
  const totalActiveUsers = onlineMetrics.totalActiveUsers;

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
            <Button variant="outline" size="sm" className="text-black" asChild>
              <a href="/analytics">
                <LineChart className="mr-2 h-4 w-4" />
                View Analytics
              </a>
            </Button>
            <Button variant="outline" size="icon" className="text-black">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="text-black">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Online Users Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Users</CardTitle>
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

            {/* Active Users Card */}
            <Card className="hover:shadow-lg transition-shadow">
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

            {/* Expenses This Month */}
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

            {/* Auth Requests Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auth Requests</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">1.2M</div>
                    <p className="text-xs text-muted-foreground">Past 24 hours</p>
                  </div>
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    +12%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Collected Summary Cards */}
            <CollectedSummaryCards />

            {/* Failed Attempts Card */}
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

            {/* Bandwidth Widget */}
            <div className="col-span-full lg:col-span-3">
              <BandwidthWidget />
            </div>

            {/* Analytics Widget */}
            <div className="col-span-full lg:col-span-2">
              <AnalyticsWidget />
            </div>

            {/* Alert Notifications */}
            <div className="col-span-full lg:col-span-1">
              <AlertNotification maxAlerts={5} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;