import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useAnalyticsData, getGrowthColor } from '@/hooks/useAnalytics';
import { useBandwidthMetrics } from '@/hooks/useBandwidth';

interface AnalyticsWidgetProps {
  timeRange?: string;
  showLink?: boolean;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ 
  timeRange = '24h', 
  showLink = true 
}) => {
  const { data: chartData, isLoading } = useAnalyticsData(timeRange);
  const bandwidthQuery = useBandwidthMetrics();
  const [bwSeries, setBwSeries] = React.useState<Array<{ time: string; rx: number; tx: number }>>([]);

  // Calculate simple metrics from the data
  const currentUsers = chartData?.[chartData.length - 1]?.users || 0;
  const previousUsers = chartData?.[chartData.length - 2]?.users || 0;
  const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

  const currentRx = bwSeries[bwSeries.length - 1]?.rx ?? 0;
  const prevRx = bwSeries[bwSeries.length - 2]?.rx ?? 0;
  const rxGrowth = prevRx > 0 ? ((currentRx - prevRx) / prevRx) * 100 : 0;

  const currentTx = bwSeries[bwSeries.length - 1]?.tx ?? 0;
  const prevTx = bwSeries[bwSeries.length - 2]?.tx ?? 0;
  const txGrowth = prevTx > 0 ? ((currentTx - prevTx) / prevTx) * 100 : 0;

  React.useEffect(() => {
    const m = bandwidthQuery.data;
    if (!m) return;
    const iface = Array.isArray(m.interfaces) ? m.interfaces[0] : undefined;
    const rx = Number((iface?.rxRate ?? m.bandwidth.download.rate) || 0);
    const tx = Number((iface?.txRate ?? m.bandwidth.upload.rate) || 0);

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBwSeries((prev) => {
      const next = [...prev, { time, rx, tx }];
      return next.slice(-30);
    });
  }, [bandwidthQuery.data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      return (
        <div className="rounded border border-border bg-card p-2 text-sm text-card-foreground shadow-lg">
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

  return (
    <Card className="w-full min-w-0 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg">Quick Analytics</CardTitle>
            <CardDescription>Real-time system overview</CardDescription>
          </div>
          <Badge variant="secondary" className="flex w-fit gap-1 items-center">
            <BarChart3 className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {isLoading ? '...' : currentUsers}
              </span>
              <div className={`flex items-center gap-1 text-xs ${getGrowthColor(userGrowth)}`}>
                {userGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(userGrowth).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Bandwidth (Rx / Tx)</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-600">
                  {bandwidthQuery.isLoading ? '...' : `${currentRx.toFixed(1)} Mbps`}
                </span>
                <div className={`flex items-center gap-1 text-xs ${getGrowthColor(rxGrowth)}`}>
                  {rxGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(rxGrowth).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-green-600">
                  {bandwidthQuery.isLoading ? '...' : `${currentTx.toFixed(1)} Mbps`}
                </span>
                <div className={`flex items-center gap-1 text-xs ${getGrowthColor(txGrowth)}`}>
                  {txGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(txGrowth).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-32">
          {bandwidthQuery.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading chart...</div>
            </div>
          ) : bwSeries.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bwSeries.slice(-8)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="rx" 
                  name="Rx (Mbps)"
                  stroke="#2563eb" 
                  fill="#2563eb" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="tx"
                  name="Tx (Mbps)"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">No data available</div>
            </div>
          )}
        </div>

        {/* Link to Full Analytics */}
        {showLink && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/analytics" className="flex items-center justify-center gap-2">
                View Full Analytics
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget; 