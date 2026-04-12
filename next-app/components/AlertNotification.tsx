import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAlerts, getSeverityColor, getSeverityBgColor } from '@/hooks/useAlerts';
import { formatDistanceToNow } from 'date-fns';

interface AlertNotificationProps {
  maxAlerts?: number;
  showLink?: boolean;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ 
  maxAlerts = 5, 
  showLink = true 
}) => {
  const { data: alerts, isLoading } = useAlerts();

  // Get recent active alerts
  const recentAlerts = alerts && Array.isArray(alerts)
    ? alerts
        .filter(alert => !alert.resolved)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxAlerts)
    : [];

  const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = recentAlerts.filter(alert => alert.severity === 'high');

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "low":
        return <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (alert: any) => {
    if (alert.resolved) {
      return <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />;
    }
    if (alert.acknowledged) {
      return <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />;
    }
    return <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
  };

  const getStatusText = (alert: any) => {
    if (alert.resolved) return 'Resolved';
    if (alert.acknowledged) return 'Acknowledged';
    return 'Active';
  };

  return (
    <Card className="w-full min-w-0 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            <CardDescription>Latest system alerts and notifications</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                {getAlertIcon('critical')}
                {criticalAlerts.length}
              </Badge>
            )}
            {highAlerts.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
                {getAlertIcon('high')}
                {highAlerts.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading alerts...</div>
          </div>
        ) : recentAlerts.length > 0 ? (
          <>
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className={`p-2 rounded-full ${getSeverityBgColor(alert.severity)}`}>
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{alert.ruleName}</h4>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(alert)}
                        {getStatusText(alert)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0 break-words">
                      Value: {String(alert.value)} | Threshold: {String(alert.threshold)}
                    </span>
                    <span className="whitespace-nowrap">{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {showLink && (
              <div className="pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <a href="/alerts" className="flex items-center justify-center gap-2">
                    View All Alerts
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active alerts</p>
              <p className="text-xs text-muted-foreground">System is running normally</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertNotification; 