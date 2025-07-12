import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  Activity, 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Download,
  RefreshCw,
  Wifi,
  Globe,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Loader2
} from 'lucide-react';
import { 
  useAnalyticsData, 
  useAnalyticsMetrics, 
  useAuthDistribution, 
  useGeographicData, 
  usePeakHoursData,
  getGrowthColor
} from '@/hooks/useAnalytics';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  
  // Fetch data using hooks
  const { data: chartData, isLoading: chartLoading, refetch: refetchChart } = useAnalyticsData(timeRange);
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useAnalyticsMetrics();
  const { data: authData, isLoading: authLoading } = useAuthDistribution();
  const { data: geographicData, isLoading: geoLoading } = useGeographicData();
  const { data: peakHoursData, isLoading: peakLoading } = usePeakHoursData();

  const handleRefresh = () => {
    refetchChart();
    refetchMetrics();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into your RADIUS system performance and user activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={chartLoading || metricsLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${(chartLoading || metricsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics?.activeUsers?.toLocaleString() || '0'}
                </div>
                <p className={`text-xs text-muted-foreground flex items-center gap-1`}>
                  <TrendingUp className={`h-3 w-3 ${getGrowthColor(metrics?.userGrowth || 0)}`} />
                  <span className={getGrowthColor(metrics?.userGrowth || 0)}>
                    {metrics?.userGrowth && metrics.userGrowth > 0 ? '+' : ''}{metrics?.userGrowth || 0}% from last hour
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.bandwidthUsage || '0 GB/s'}
                </div>
                <p className={`text-xs text-muted-foreground flex items-center gap-1`}>
                  <TrendingUp className={`h-3 w-3 ${getGrowthColor(metrics?.bandwidthGrowth || 0)}`} />
                  <span className={getGrowthColor(metrics?.bandwidthGrowth || 0)}>
                    {metrics?.bandwidthGrowth && metrics.bandwidthGrowth > 0 ? '+' : ''}{metrics?.bandwidthGrowth || 0}% from last hour
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Success Rate</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.authSuccessRate || 0}%
                </div>
                <p className={`text-xs text-muted-foreground flex items-center gap-1`}>
                  <TrendingUp className={`h-3 w-3 ${getGrowthColor(metrics?.authRateGrowth || 0)}`} />
                  <span className={getGrowthColor(metrics?.authRateGrowth || 0)}>
                    {metrics?.authRateGrowth && metrics.authRateGrowth > 0 ? '+' : ''}{metrics?.authRateGrowth || 0}% from last hour
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {metrics?.failedAttempts || 0}
                </div>
                <p className={`text-xs text-muted-foreground flex items-center gap-1`}>
                  <TrendingDown className={`h-3 w-3 ${getGrowthColor(metrics?.failedAttemptsGrowth || 0)}`} />
                  <span className={getGrowthColor(metrics?.failedAttemptsGrowth || 0)}>
                    {metrics?.failedAttemptsGrowth && metrics.failedAttemptsGrowth > 0 ? '+' : ''}{metrics?.failedAttemptsGrowth || 0}% from last hour
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Usage Trends
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authentication
          </TabsTrigger>
          <TabsTrigger value="geographic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geographic
          </TabsTrigger>
          <TabsTrigger value="peak" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Peak Hours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Over Time</CardTitle>
                <CardDescription>Real-time user count and activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <LoadingSpinner />
                ) : chartData && Array.isArray(chartData) && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bandwidth Usage</CardTitle>
                <CardDescription>Network bandwidth consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <LoadingSpinner />
                ) : chartData && Array.isArray(chartData) && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="bandwidth" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Success Rate</CardTitle>
                <CardDescription>Distribution of authentication attempts</CardDescription>
              </CardHeader>
              <CardContent>
                {authLoading ? (
                  <LoadingSpinner />
                ) : authData && Array.isArray(authData) && authData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={authData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {authData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication Trends</CardTitle>
                <CardDescription>Success vs failed authentication over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <LoadingSpinner />
                ) : chartData && Array.isArray(chartData) && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="authSuccess" fill="#10b981" />
                      <Bar dataKey="authFailed" fill="#ef4444" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>User distribution by region</CardDescription>
              </CardHeader>
              <CardContent>
                {geoLoading ? (
                  <LoadingSpinner />
                ) : geographicData && Array.isArray(geographicData) && geographicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={geographicData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, users }) => `${name}: ${users}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="users"
                      >
                        {geographicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Regions by Users</CardTitle>
                <CardDescription>User count by geographic region</CardDescription>
              </CardHeader>
              <CardContent>
                {geoLoading ? (
                  <LoadingSpinner />
                ) : geographicData && Array.isArray(geographicData) && geographicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geographicData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="users" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="peak" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Peak Usage Hours</CardTitle>
              <CardDescription>System usage patterns throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              {peakLoading ? (
                <LoadingSpinner />
              ) : peakHoursData && Array.isArray(peakHoursData) && peakHoursData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="usage" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;