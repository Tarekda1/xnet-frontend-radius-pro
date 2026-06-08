import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { notify } from '@/lib/notify';
import { MESSAGES } from '@/constants/messages';
import { 
  AlertRule, 
  Alert, 
  AlertSettings, 
  ALERT_METRICS, 
  ALERT_CONDITIONS, 
  ALERT_SEVERITIES 
} from '@/types/alerts';

// Mock data for development
const generateMockAlertRules = (): AlertRule[] => [
  {
    id: '1',
    name: 'High User Load',
    description: 'Alert when active users exceed threshold',
    metric: ALERT_METRICS[0], // users
    condition: 'greater_than',
    threshold: 1000,
    duration: 5,
    severity: 'high',
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastTriggered: new Date('2024-01-15T10:30:00'),
    triggerCount: 3
  },
  {
    id: '2',
    name: 'Low Auth Success Rate',
    description: 'Alert when authentication success rate drops',
    metric: ALERT_METRICS[2], // auth_success_rate
    condition: 'less_than',
    threshold: 90,
    duration: 10,
    severity: 'critical',
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastTriggered: new Date('2024-01-15T09:15:00'),
    triggerCount: 1
  },
  {
    id: '3',
    name: 'High Failed Attempts',
    description: 'Alert when failed authentication attempts spike',
    metric: ALERT_METRICS[3], // auth_failed_attempts
    condition: 'greater_than',
    threshold: 50,
    duration: 5,
    severity: 'medium',
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    triggerCount: 0
  }
];

const generateMockAlerts = (): Alert[] => [
  {
    id: '1',
    ruleId: '1',
    ruleName: 'High User Load',
    severity: 'high',
    message: 'Active users (1,234) exceeded threshold (1,000)',
    metric: 'users',
    value: 1234,
    threshold: 1000,
    timestamp: new Date('2024-01-15T10:30:00'),
    acknowledged: false,
    resolved: false
  },
  {
    id: '2',
    ruleId: '2',
    ruleName: 'Low Auth Success Rate',
    severity: 'critical',
    message: 'Authentication success rate (85%) dropped below threshold (90%)',
    metric: 'auth_success_rate',
    value: 85,
    threshold: 90,
    timestamp: new Date('2024-01-15T09:15:00'),
    acknowledged: true,
    acknowledgedBy: 'admin@example.com',
    acknowledgedAt: new Date('2024-01-15T09:20:00'),
    resolved: true,
    resolvedAt: new Date('2024-01-15T09:45:00')
  }
];

const generateMockSettings = (): AlertSettings => ({
  emailNotifications: true,
  smsNotifications: false,
  webhookNotifications: true,
  inAppNotifications: true,
  emailRecipients: ['admin@example.com', 'ops@example.com'],
  smsRecipients: ['+1234567890'],
  webhookUrl: 'https://api.example.com/webhooks/alerts',
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC'
  },
  escalationPolicy: {
    enabled: true,
    escalationDelay: 30,
    maxEscalations: 3
  }
});

// API envelope `{ success, data }` from backend; support raw arrays for compatibility.
function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

function unwrapEntity<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw && (raw as { data: unknown }).data !== undefined) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

// API functions
const fetchAlertRules = async (): Promise<AlertRule[]> => {
  try {
    const response = await apiClient.get('/alerts/rules');
    return unwrapList<AlertRule>(response.data);
  } catch (error) {
    console.warn('Using mock data for alert rules:', error);
    return generateMockAlertRules();
  }
};

const fetchAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await apiClient.get('/alerts');
    return unwrapList<Alert>(response.data);
  } catch (error) {
    console.warn('Failed to fetch alerts:', error);
    return [];
  }
};

const fetchAlertSettings = async (): Promise<AlertSettings> => {
  try {
    const response = await apiClient.get('/alerts/settings');
    return unwrapEntity<AlertSettings>(response.data);
  } catch (error) {
    console.warn('Using mock data for alert settings:', error);
    return generateMockSettings();
  }
};

const createAlertRule = async (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<AlertRule> => {
  try {
    const response = await apiClient.post('/alerts/rules', rule);
    return unwrapEntity<AlertRule>(response.data);
  } catch (error) {
    console.error('Failed to create alert rule:', error);
    throw error;
  }
};

const updateAlertRule = async (id: string, updates: Partial<AlertRule>): Promise<AlertRule> => {
  try {
    const response = await apiClient.put(`/alerts/rules/${id}`, updates);
    return unwrapEntity<AlertRule>(response.data);
  } catch (error) {
    console.error('Failed to update alert rule:', error);
    throw error;
  }
};

const deleteAlertRule = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/alerts/rules/${id}`);
  } catch (error) {
    console.error('Failed to delete alert rule:', error);
    throw error;
  }
};

const acknowledgeAlert = async (id: string, acknowledgedBy: string): Promise<Alert> => {
  try {
    const response = await apiClient.post(`/alerts/${id}/acknowledge`, { acknowledgedBy });
    return unwrapEntity<Alert>(response.data);
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    throw error;
  }
};

const resolveAlert = async (id: string): Promise<Alert> => {
  try {
    const response = await apiClient.post(`/alerts/${id}/resolve`);
    return unwrapEntity<Alert>(response.data);
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    throw error;
  }
};

const updateAlertSettings = async (settings: AlertSettings): Promise<AlertSettings> => {
  try {
    const response = await apiClient.put('/alerts/settings', settings);
    return unwrapEntity<AlertSettings>(response.data);
  } catch (error) {
    console.error('Failed to update alert settings:', error);
    throw error;
  }
};

// Custom hooks
export const useAlertRules = () => {
  return useQuery({
    queryKey: ['alerts', 'rules'],
    queryFn: fetchAlertRules,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

export const useAlertSettings = () => {
  return useQuery({
    queryKey: ['alerts', 'settings'],
    queryFn: fetchAlertSettings,
    staleTime: 60000, // Consider data stale after 1 minute
  });
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      notify.success("Created", MESSAGES.alerts.ruleCreated);
    },
    onError: (error: unknown) => {
      notify.error("Create failed", error instanceof Error ? error.message : MESSAGES.common.createFailed);
    },
  });
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AlertRule> }) => 
      updateAlertRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      notify.success("Saved", MESSAGES.alerts.ruleUpdated);
    },
    onError: (error: unknown) => {
      notify.error("Save failed", error instanceof Error ? error.message : MESSAGES.common.updateFailed);
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      notify.success("Deleted", MESSAGES.alerts.ruleDeleted);
    },
    onError: (error: unknown) => {
      notify.error("Delete failed", error instanceof Error ? error.message : MESSAGES.common.deleteFailed);
    },
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, acknowledgedBy }: { id: string; acknowledgedBy: string }) => 
      acknowledgeAlert(id, acknowledgedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      notify.success("Success", MESSAGES.alerts.acknowledged);
    },
    onError: (error: unknown) => {
      notify.error("Action failed", error instanceof Error ? error.message : MESSAGES.common.actionFailed);
    },
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      notify.success("Success", MESSAGES.alerts.resolved);
    },
    onError: (error: unknown) => {
      notify.error("Action failed", error instanceof Error ? error.message : MESSAGES.common.actionFailed);
    },
  });
};

export const useUpdateAlertSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateAlertSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'settings'] });
      notify.success("Saved", MESSAGES.alerts.settingsUpdated);
    },
    onError: (error: unknown) => {
      notify.error("Save failed", error instanceof Error ? error.message : MESSAGES.common.updateFailed);
    },
  });
};

// Utility functions
export const getSeverityColor = (severity: string): string => {
  const severityConfig = ALERT_SEVERITIES.find(s => s.value === severity);
  return severityConfig?.color || "text-muted-foreground";
};

export const getSeverityBgColor = (severity: string): string => {
  const severityConfig = ALERT_SEVERITIES.find(s => s.value === severity);
  return severityConfig?.bgColor || "bg-muted";
};

export const formatAlertMessage = (alert: Alert): string => {
  const metric = ALERT_METRICS.find(m => m.type === alert.metric);
  const unit = metric?.unit || '';
  
  return `${alert.metric} (${alert.value}${unit}) ${alert.message}`;
};

export const isInQuietHours = (settings: AlertSettings | undefined): boolean => {
  if (!settings || !settings.quietHours || !settings.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const { startTime, endTime } = settings.quietHours;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
}; 