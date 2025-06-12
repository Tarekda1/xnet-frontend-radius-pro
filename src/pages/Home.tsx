import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Server,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Wifi,
  Database,
  ArrowRight,
  CheckCircle,
  Bell,
  Clock,
  AlertTriangle,
  ChevronRight,
  Cpu,
  HardDrive
} from 'lucide-react';
import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  linkTo, 
  linkText,
  badge,
  stats
}: { 
  title: string;
  description: string;
  icon: React.ElementType;
  linkTo: string;
  linkText: string;
  badge?: string;
  stats?: { label: string; value: string | number; }[];
}) => (
  <Card className="group hover:shadow-lg transition-all duration-200">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {badge && (
          <Badge variant="secondary" className="group-hover:bg-primary/10">
            {badge}
          </Badge>
        )}
      </div>
      <CardTitle className="text-xl mt-4">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    {stats && (
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    )}
    <CardFooter>
      <Link to={linkTo} className="w-full">
        <Button className="w-full group-hover:bg-primary/90" variant="default">
          {linkText}
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </CardFooter>
  </Card>
);

const QuickStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  pulseColor
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  pulseColor?: string;
}) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-primary/10 relative ${pulseColor ? 'after:absolute after:inset-0 after:rounded-lg after:animate-pulse ' + pulseColor : ''}`}>
          <Icon className="h-5 w-5 text-primary relative z-10" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const SystemHealthCard = () => {
  const [cpuUsage, setCpuUsage] = useState(45);
  const [memoryUsage, setMemoryUsage] = useState(60);
  const [diskUsage, setDiskUsage] = useState(25);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
      setMemoryUsage(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
      setDiskUsage(prev => Math.min(100, Math.max(0, prev + (Math.random() * 2 - 1))));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">System Health</CardTitle>
        <CardDescription>Real-time system metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">CPU Usage</span>
            </div>
            <span className="text-sm font-medium">{Math.round(cpuUsage)}%</span>
          </div>
          <Progress value={cpuUsage} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <span className="text-sm font-medium">{Math.round(memoryUsage)}%</span>
          </div>
          <Progress value={memoryUsage} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Disk Usage</span>
            </div>
            <span className="text-sm font-medium">{Math.round(diskUsage)}%</span>
          </div>
          <Progress value={diskUsage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

const RecentActivityCard = () => {
  const activities = [
    { type: 'success', message: 'User authentication successful', time: '2 minutes ago', icon: CheckCircle, color: 'text-green-600' },
    { type: 'warning', message: 'High CPU usage detected', time: '15 minutes ago', icon: AlertTriangle, color: 'text-yellow-600' },
    { type: 'error', message: 'Failed login attempt', time: '1 hour ago', icon: AlertTriangle, color: 'text-red-600' },
    { type: 'info', message: 'System backup completed', time: '2 hours ago', icon: CheckCircle, color: 'text-blue-600' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <div className={`rounded-full p-2 ${activity.color.replace('text', 'bg')}/10`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.message}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {activity.time}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full">
          View All Activity
        </Button>
      </CardFooter>
    </Card>
  );
};

const Home: React.FC = () => {
  const { totalOnlineUsers, totalActiveUsers } = useOnlineMetrics();

  return (
    <div className="container space-y-8 p-8 animate-in fade-in-50">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to RADIUS Pro</h1>
        <p className="text-muted-foreground">
          Your complete RADIUS server management solution. Monitor, manage, and optimize your network access.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          title="Active Users"
          value={totalActiveUsers?.toString() ?? "0"}
          icon={Users}
          trend="23% increase this month"
        />
        <QuickStatCard
          title="Server Uptime"
          value="99.9%"
          icon={Server}
          trend="Last 30 days"
          pulseColor="after:bg-green-500/10"
        />
        <QuickStatCard
          title="Auth Requests"
          value="1.2M"
          icon={Shield}
          trend="Past 24 hours"
          pulseColor="after:bg-blue-500/10"
        />
        <QuickStatCard
          title="Connected Devices"
          value={totalOnlineUsers?.toString() ?? "0"}
          icon={Wifi}
          trend="Currently online"
          pulseColor="after:bg-purple-500/10"
        />
      </div>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <SystemHealthCard />
        <RecentActivityCard />
      </div>

      {/* Main Features Grid */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Features</TabsTrigger>
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="pro">Pro</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="User Management"
              description="Efficiently manage your RADIUS users, groups, and access policies with our intuitive interface."
              icon={Users}
              linkTo="/users"
              linkText="Manage Users"
              badge="Core"
              stats={[
                { label: 'Total Users', value: totalActiveUsers ?? 0 },
                { label: 'Online', value: totalOnlineUsers ?? 0 },
              ]}
            />
            <FeatureCard
              title="Server Monitoring"
              description="Real-time monitoring of your RADIUS server performance, health metrics, and system resources."
              icon={Activity}
              linkTo="/dashboard"
              linkText="View Dashboard"
              badge="Pro"
              stats={[
                { label: 'CPU Usage', value: '45%' },
                { label: 'Memory', value: '60%' },
              ]}
            />
            <FeatureCard
              title="Analytics & Reports"
              description="Comprehensive analytics and detailed reports about authentication, usage patterns, and more."
              icon={BarChart3}
              linkTo="/reports"
              linkText="View Reports"
              stats={[
                { label: 'Daily Auth', value: '125K' },
                { label: 'Success Rate', value: '99.9%' },
              ]}
            />
            <FeatureCard
              title="Network Access Control"
              description="Configure and manage network access policies, VLANs, and security settings."
              icon={Shield}
              linkTo="/settings"
              linkText="Configure NAC"
              badge="Pro"
              stats={[
                { label: 'Active Policies', value: '24' },
                { label: 'VLANs', value: '12' },
              ]}
            />
            <FeatureCard
              title="System Configuration"
              description="Advanced system settings, backup management, and server configuration options."
              icon={Settings}
              linkTo="/settings"
              linkText="System Settings"
              stats={[
                { label: 'Last Backup', value: '2h ago' },
                { label: 'Config Items', value: '156' },
              ]}
            />
            <FeatureCard
              title="Database Management"
              description="Manage your RADIUS database, perform backups, and maintain data integrity."
              icon={Database}
              linkTo="/database"
              linkText="Manage Database"
              badge="Pro"
              stats={[
                { label: 'Size', value: '2.4 GB' },
                { label: 'Tables', value: '24' },
              ]}
            />
          </div>
        </TabsContent>
        <TabsContent value="core">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Filter only Core features */}
            <FeatureCard
              title="User Management"
              description="Efficiently manage your RADIUS users, groups, and access policies with our intuitive interface."
              icon={Users}
              linkTo="/users"
              linkText="Manage Users"
              badge="Core"
              stats={[
                { label: 'Total Users', value: totalActiveUsers ?? 0 },
                { label: 'Online', value: totalOnlineUsers ?? 0 },
              ]}
            />
            {/* Add other core features */}
          </div>
        </TabsContent>
        <TabsContent value="pro">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Filter only Pro features */}
            <FeatureCard
              title="Server Monitoring"
              description="Real-time monitoring of your RADIUS server performance, health metrics, and system resources."
              icon={Activity}
              linkTo="/dashboard"
              linkText="View Dashboard"
              badge="Pro"
              stats={[
                { label: 'CPU Usage', value: '45%' },
                { label: 'Memory', value: '60%' },
              ]}
            />
            {/* Add other pro features */}
          </div>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-primary/5 border-none">
        <CardHeader>
          <CardTitle>Need Help Getting Started?</CardTitle>
          <CardDescription>
            Check out our comprehensive documentation and guides to help you make the most of RADIUS Pro.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-4">
          <Button variant="default">
            View Documentation
          </Button>
          <Button variant="outline">
            Watch Tutorial
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Home;