export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  duration: number; // in minutes
  severity: AlertSeverity;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AlertMetric {
  type: 'users' | 'bandwidth' | 'auth_success_rate' | 'auth_failed_attempts' | 'cpu_usage' | 'memory_usage' | 'disk_usage';
  label: string;
  unit: string;
  description: string;
}

export type AlertCondition = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  type: 'email' | 'sms' | 'webhook' | 'in_app';
  status: 'pending' | 'sent' | 'failed';
  recipient?: string;
  message: string;
  sentAt?: Date;
  error?: string;
}

export interface AlertSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  webhookNotifications: boolean;
  inAppNotifications: boolean;
  emailRecipients: string[];
  smsRecipients: string[];
  webhookUrl?: string;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  escalationPolicy: {
    enabled: boolean;
    escalationDelay: number; // in minutes
    maxEscalations: number;
  };
}

// Predefined alert metrics
export const ALERT_METRICS: AlertMetric[] = [
  {
    type: 'users',
    label: 'Active Users',
    unit: 'users',
    description: 'Number of currently active users'
  },
  {
    type: 'bandwidth',
    label: 'Bandwidth Usage',
    unit: 'MB/s',
    description: 'Current bandwidth consumption'
  },
  {
    type: 'auth_success_rate',
    label: 'Authentication Success Rate',
    unit: '%',
    description: 'Percentage of successful authentication attempts'
  },
  {
    type: 'auth_failed_attempts',
    label: 'Failed Authentication Attempts',
    unit: 'attempts',
    description: 'Number of failed authentication attempts'
  },
  {
    type: 'cpu_usage',
    label: 'CPU Usage',
    unit: '%',
    description: 'Current CPU utilization'
  },
  {
    type: 'memory_usage',
    label: 'Memory Usage',
    unit: '%',
    description: 'Current memory utilization'
  },
  {
    type: 'disk_usage',
    label: 'Disk Usage',
    unit: '%',
    description: 'Current disk space utilization'
  }
];

// Predefined alert conditions
export const ALERT_CONDITIONS = [
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'percentage_change', label: 'Percentage Change' }
] as const;

// Predefined alert severities
export const ALERT_SEVERITIES = [
  { value: 'low', label: 'Low', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 'critical', label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' }
] as const; 