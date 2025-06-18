import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';
import { useInvoiceNotifications } from '@/hooks/useInvoiceNotifications';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  UserCheck, 
  Shield, 
  AlertTriangle, 
  Server, 
  Activity, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  CircuitBoard,
  HardDrive,
  MoreHorizontal,
  Receipt,
  Bell,
  Settings,
  LineChart
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

const Dashboard: React.FC = () => {
  const { totalOnlineUsers, totalActiveUsers } = useOnlineMetrics();
  const invoiceNotifications = useInvoiceNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setLastRefresh(new Date());
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
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your system's performance and user activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-fit" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

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

            {/* Failed Attempts Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">145</div>
                    <p className="text-xs text-muted-foreground">Past 24 hours</p>
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

            {/* Recent Activity */}
            <Card className="md:col-span-3 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system events and notifications</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8" onClick={handleRefresh} disabled={isLoading}>
                      <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoiceNotifications.slice(0, 5).map((notification, index) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors group">
                      <div className="rounded-full bg-green-100 p-2 group-hover:bg-green-200 transition-colors">
                        <Receipt className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                          {notification.data?.amount && (
                            <Badge variant="secondary" className="text-xs">
                              ${notification.data.amount.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Fallback content when no notifications */}
                  {invoiceNotifications.length === 0 && (
                    <>
                      <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors group">
                        <div className="rounded-full bg-blue-100 p-2 group-hover:bg-blue-200 transition-colors">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">User authentication successful</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                            <Badge variant="outline" className="text-xs">Security</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors group">
                        <div className="rounded-full bg-red-100 p-2 group-hover:bg-red-200 transition-colors">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Failed login attempt</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                            <Badge variant="destructive" className="text-xs">Alert</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors group">
                        <div className="rounded-full bg-green-100 p-2 group-hover:bg-green-200 transition-colors">
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">New user added</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                            <Badge variant="outline" className="text-xs">User</Badge>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;