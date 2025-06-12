import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';
import { useInvoiceNotifications } from '@/hooks/useInvoiceNotifications';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Receipt
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

  return (
    <div className="w-full space-y-6 p-8 animate-in fade-in-50">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your system's performance and user activity.</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

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
                <CardDescription>Real-time system metrics</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
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
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="h-2 w-full bg-slate-200 rounded-full">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                        style={{ width: '45%' }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>CPU Usage: 45%</p>
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
                  <span className="text-sm font-medium">60%</span>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="h-2 w-full bg-slate-200 rounded-full">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                        style={{ width: '60%' }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Memory Usage: 60%</p>
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
                  <span className="text-sm font-medium">25%</span>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="h-2 w-full bg-slate-200 rounded-full">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all duration-500" 
                        style={{ width: '25%' }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Disk Usage: 25%</p>
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
                <CardDescription>Latest system events</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoiceNotifications.map((notification, index) => (
                <div key={index} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                  <div className="rounded-full bg-green-100 p-2">
                    <Receipt className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        ${notification.data.amount.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {/* Fallback content when no notifications */}
              {invoiceNotifications.length === 0 && (
                <>
                  <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">User authentication successful</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Failed login attempt</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="rounded-full bg-green-100 p-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New user added</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;