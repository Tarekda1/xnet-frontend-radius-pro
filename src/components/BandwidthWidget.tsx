import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Upload,
  Activity,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Server
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBandwidthMetrics, formatBitsPerSecond, formatBytes, formatUptime, bitsToMbps } from '@/hooks/useBandwidth';

export const bytesPerSecToMbps = (bps: number, decimals = 2) =>
  ((bps * 8) / 1_000_000).toFixed(decimals);   // returns string

const BandwidthWidget: React.FC = () => {
  const { data: metrics, isLoading, error } = useBandwidthMetrics();

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[120px]" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover:shadow-lg transition-shadow border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-red-700">Bandwidth Monitor</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </div>
          <CardDescription className="text-red-600">Connection Error</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Unable to connect to MikroTik router</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return <div>No metric data available</div>;
  }

  const { bandwidth, system } = metrics;

  const ether3DownloadMbps = bitsToMbps(bandwidth.download.rate) || '0';
  const ether3UploadMbps = bitsToMbps(bandwidth.upload.rate) || '0';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Bandwidth Monitor</CardTitle>
            <CardDescription>Real-time network traffic</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              Live
            </Badge>
            <Server className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          {/* Download Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Download</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {ether3DownloadMbps} Mbps
                </span>
                <Badge variant="secondary" className="text-xs">
                  {bandwidth.download.utilization.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(bandwidth.download.utilization, 100)}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download: {formatBitsPerSecond(bandwidth.download.rate)} ({formatBytes(bandwidth.download.bytes)} total)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Upload Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Upload</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {ether3UploadMbps} Mbps
                </span>
                <Badge variant="secondary" className="text-xs">
                  {bandwidth.upload.utilization.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(bandwidth.upload.utilization, 100)}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload: {formatBitsPerSecond(bandwidth.upload.rate)} ({formatBytes(bandwidth.upload.bytes)} total)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Total Traffic */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Traffic</span>
              <span>{formatBytes(bandwidth.total.bytes)}</span>
            </div>
          </div>

          {/* System Info */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CPU Load</span>
              <span className="font-medium">{system.cpuLoad}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-medium">{system.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{formatUptime(system.uptime)}</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default BandwidthWidget; 