import React, { useState } from 'react';
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Bell, 
  BellOff, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Clock,
  Mail,
  MessageSquare,
  Webhook,
  Smartphone,
  Loader2,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { 
  useAlertRules, 
  useAlerts, 
  useAlertSettings,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useAcknowledgeAlert,
  useResolveAlert,
  useUpdateAlertSettings,
  getSeverityColor,
  getSeverityBgColor,
  formatAlertMessage,
  isInQuietHours
} from '@/hooks/useAlerts';
import { 
  AlertRule, 
  Alert, 
  AlertSettings,
  ALERT_METRICS, 
  ALERT_CONDITIONS, 
  ALERT_SEVERITIES 
} from '@/types/alerts';
import { formatDistanceToNow } from 'date-fns';

const Alerts: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Data hooks
  const { data: alertRules, isLoading: rulesLoading } = useAlertRules();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: settings, isLoading: settingsLoading } = useAlertSettings();
  
  // Mutation hooks
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const updateSettings = useUpdateAlertSettings();

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric: '',
    condition: '',
    threshold: '',
    duration: '',
    severity: '',
    enabled: true
  });

  // Filter alerts
  const filteredAlerts = alerts && Array.isArray(alerts)
    ? alerts.filter(alert => {
        const matchesSearch = alert.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             alert.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'active' && !alert.resolved) ||
                             (statusFilter === 'resolved' && alert.resolved);
        
        return matchesSearch && matchesSeverity && matchesStatus;
      })
    : [];

  const handleCreateRule = () => {
    const newRule = {
      name: formData.name,
      description: formData.description,
      metric: ALERT_METRICS.find(m => m.type === formData.metric)!,
      condition: formData.condition as any,
      threshold: parseFloat(formData.threshold),
      duration: parseInt(formData.duration),
      severity: formData.severity as any,
      enabled: formData.enabled
    };

    createRule.mutate(newRule, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;

    const updates = {
      name: formData.name,
      description: formData.description,
      metric: ALERT_METRICS.find(m => m.type === formData.metric)!,
      condition: formData.condition as any,
      threshold: parseFloat(formData.threshold),
      duration: parseInt(formData.duration),
      severity: formData.severity as any,
      enabled: formData.enabled
    };

    updateRule.mutate({ id: editingRule.id, updates }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingRule(null);
        resetForm();
      }
    });
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      metric: rule.metric.type,
      condition: rule.condition,
      threshold: rule.threshold.toString(),
      duration: rule.duration.toString(),
      severity: rule.severity,
      enabled: rule.enabled
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    deleteRule.mutate(id);
  };

  const handleAcknowledgeAlert = (id: string) => {
    acknowledgeAlert.mutate({ id, acknowledgedBy: 'current-user@example.com' });
  };

  const handleResolveAlert = (id: string) => {
    resolveAlert.mutate(id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      metric: '',
      condition: '',
      threshold: '',
      duration: '',
      severity: '',
      enabled: true
    });
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="w-full space-y-6 p-6">
      <PageHeader
        title="Alert Management"
        subtitle="Monitor system metrics and configure threshold-based notifications."
        icon={AlertTriangle}
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert Rule
            </Button>
          </div>
        )}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {rulesLoading ? '...' : (alertRules && Array.isArray(alertRules) ? alertRules.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {alertRules && Array.isArray(alertRules) ? alertRules.filter(r => r.enabled).length : 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alertsLoading ? '...' : (alerts && Array.isArray(alerts) ? alerts.filter(a => !a.resolved).length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts && Array.isArray(alerts) ? alerts.filter(a => !a.acknowledged && !a.resolved).length : 0} unacknowledged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alertsLoading ? '...' : (alerts && Array.isArray(alerts) ? alerts.filter(a => a.severity === 'critical' && !a.resolved).length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiet Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {settingsLoading ? '...' : (settings ? (isInQuietHours(settings) ? 'Active' : 'Inactive') : 'Disabled')}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings?.quietHours?.enabled ? `${settings.quietHours.startTime} - ${settings.quietHours.endTime}` : 'Disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Rules
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Alerts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Alert History
          </TabsTrigger>
        </TabsList>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {rulesLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid gap-4">
              {alertRules && Array.isArray(alertRules) ? alertRules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSeverityBgColor(rule.severity)}`}>
                          <Bell className={`h-4 w-4 ${getSeverityColor(rule.severity)}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <CardDescription>{rule.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "Active" : "Disabled"}
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Alert Rule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{rule.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRule(rule.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Metric:</span>
                        <p className="text-muted-foreground">{rule.metric.label}</p>
                      </div>
                      <div>
                        <span className="font-medium">Condition:</span>
                        <p className="text-muted-foreground">
                          {ALERT_CONDITIONS.find(c => c.value === rule.condition)?.label}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Threshold:</span>
                        <p className="text-muted-foreground">
                          {rule.threshold} {rule.metric.unit}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-muted-foreground">{rule.duration} minutes</p>
                      </div>
                    </div>
                    {rule.lastTriggered && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Last triggered: {formatDistanceToNow(rule.lastTriggered, { addSuffix: true })} 
                          ({rule.triggerCount} times total)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No alert rules found</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {alertsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSeverityBgColor(alert.severity)}`}>
                          <AlertTriangle className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{alert.ruleName}</CardTitle>
                          <CardDescription>{alert.message}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="secondary">
                            Acknowledged
                          </Badge>
                        )}
                        {alert.resolved && (
                          <Badge variant="default">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Value:</span>
                        <p className="text-muted-foreground">{alert.value}</p>
                      </div>
                      <div>
                        <span className="font-medium">Threshold:</span>
                        <p className="text-muted-foreground">{alert.threshold}</p>
                      </div>
                      <div>
                        <span className="font-medium">Triggered:</span>
                        <p className="text-muted-foreground">
                          {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-muted-foreground">
                          {alert.resolved ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Active'}
                        </p>
                      </div>
                    </div>
                    
                    {!alert.resolved && (
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={acknowledgeAlert.isPending}
                          >
                            {acknowledgeAlert.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          {resolveAlert.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Resolve
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {filteredAlerts.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No alerts found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Alert History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Historical view of all alerts and their resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Alert history feature coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Alert Rule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
            <DialogDescription>
              Configure a new alert rule to monitor system metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div>
              <Label htmlFor="metric">Metric</Label>
              <Select value={formData.metric} onValueChange={(value) => setFormData({ ...formData, metric: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_METRICS.map((metric) => (
                    <SelectItem key={metric.type} value={metric.type}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                placeholder="Enter threshold value"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Enter duration"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_SEVERITIES.map((severity) => (
                    <SelectItem key={severity.value} value={severity.value}>
                      {severity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable rule</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRule}
              disabled={createRule.isPending || !formData.name || !formData.metric || !formData.condition || !formData.threshold || !formData.duration || !formData.severity}
            >
              {createRule.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Alert Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Alert Rule</DialogTitle>
            <DialogDescription>
              Modify the alert rule configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Rule Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div>
              <Label htmlFor="edit-metric">Metric</Label>
              <Select value={formData.metric} onValueChange={(value) => setFormData({ ...formData, metric: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_METRICS.map((metric) => (
                    <SelectItem key={metric.type} value={metric.type}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-threshold">Threshold</Label>
              <Input
                id="edit-threshold"
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                placeholder="Enter threshold value"
              />
            </div>
            <div>
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Enter duration"
              />
            </div>
            <div>
              <Label htmlFor="edit-severity">Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_SEVERITIES.map((severity) => (
                    <SelectItem key={severity.value} value={severity.value}>
                      {severity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="edit-enabled">Enable rule</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRule}
              disabled={updateRule.isPending || !formData.name || !formData.metric || !formData.condition || !formData.threshold || !formData.duration || !formData.severity}
            >
              {updateRule.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Edit className="mr-2 h-4 w-4" />
              )}
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Settings</DialogTitle>
            <DialogDescription>
              Configure notification preferences and escalation policies.
            </DialogDescription>
          </DialogHeader>
          {settingsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </div>
                    <Switch
                      checked={settings?.emailNotifications || false}
                      onCheckedChange={(checked) => 
                        settings && updateSettings.mutate({ ...settings, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>SMS Notifications</span>
                    </div>
                    <Switch
                      checked={settings?.smsNotifications || false}
                      onCheckedChange={(checked) => 
                        settings && updateSettings.mutate({ ...settings, smsNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      <span>Webhook Notifications</span>
                    </div>
                    <Switch
                      checked={settings?.webhookNotifications || false}
                      onCheckedChange={(checked) => 
                        settings && updateSettings.mutate({ ...settings, webhookNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>In-App Notifications</span>
                    </div>
                    <Switch
                      checked={settings?.inAppNotifications || false}
                      onCheckedChange={(checked) => 
                        settings && updateSettings.mutate({ ...settings, inAppNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <h3 className="text-lg font-medium mb-4">Quiet Hours</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Enable Quiet Hours</span>
                    <Switch
                      checked={settings?.quietHours?.enabled || false}
                      onCheckedChange={(checked) => 
                        settings && updateSettings.mutate({ 
                          ...settings, 
                          quietHours: { ...settings.quietHours, enabled: checked }
                        })
                      }
                    />
                  </div>
                  {settings?.quietHours?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.startTime}
                          onChange={(e) => 
                            updateSettings.mutate({ 
                              ...settings!, 
                              quietHours: { ...settings.quietHours, startTime: e.target.value }
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.endTime}
                          onChange={(e) => 
                            updateSettings.mutate({ 
                              ...settings!, 
                              quietHours: { ...settings.quietHours, endTime: e.target.value }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Escalation Policy */}
              <div>
                <h3 className="text-lg font-medium mb-4">Escalation Policy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Enable Escalation</span>
                    <Switch
                      checked={settings?.escalationPolicy?.enabled || false}
                      onCheckedChange={(checked) => 
                        settings && updateSettings.mutate({ 
                          ...settings, 
                          escalationPolicy: { ...settings.escalationPolicy, enabled: checked }
                        })
                      }
                    />
                  </div>
                  {settings?.escalationPolicy?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Escalation Delay (minutes)</Label>
                        <Input
                          type="number"
                          value={settings.escalationPolicy.escalationDelay}
                          onChange={(e) => 
                            updateSettings.mutate({ 
                              ...settings!, 
                              escalationPolicy: { 
                                ...settings.escalationPolicy, 
                                escalationDelay: parseInt(e.target.value) 
                              }
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Max Escalations</Label>
                        <Input
                          type="number"
                          value={settings.escalationPolicy.maxEscalations}
                          onChange={(e) => 
                            updateSettings.mutate({ 
                              ...settings!, 
                              escalationPolicy: { 
                                ...settings.escalationPolicy, 
                                maxEscalations: parseInt(e.target.value) 
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Alerts; 