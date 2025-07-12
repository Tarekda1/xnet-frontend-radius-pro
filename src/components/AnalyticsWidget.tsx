import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
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

interface AnalyticsWidgetProps {
  timeRange?: string;
  showLink?: boolean;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ 
  timeRange = '24h', 
  showLink = true 
}) => {
  const { data: chartData, isLoading } = useAnalyticsData(timeRange);

  // Calculate simple metrics from the data
  const currentUsers = chartData?.[chartData.length - 1]?.users || 0;
  const previousUsers = chartData?.[chartData.length - 2]?.users || 0;
  const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

  const currentBandwidth = chartData?.[chartData.length - 1]?.bandwidth || 0;
  const previousBandwidth = chartData?.[chartData.length - 2]?.bandwidth || 0;
  const bandwidthGrowth = previousBandwidth > 0 ? ((currentBandwidth - previousBandwidth) / previousBandwidth) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-lg text-sm">
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Analytics</CardTitle>
            <CardDescription>Real-time system overview</CardDescription>
          </div>
          <Badge variant="secondary" className="flex gap-1 items-center">
            <BarChart3 className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Metrics */}
        <div className="grid grid-cols-2 gap-4">
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
            <p className="text-sm text-muted-foreground">Bandwidth</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : `${currentBandwidth} MB/s`}
              </span>
              <div className={`flex items-center gap-1 text-xs ${getGrowthColor(bandwidthGrowth)}`}>
                {bandwidthGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(bandwidthGrowth).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-32">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading chart...</div>
            </div>
          ) : chartData && Array.isArray(chartData) && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice(-8)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                  dataKey="users" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
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