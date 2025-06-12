export interface InvoiceNotification {
  message: string;
  timestamp: string;
  data: {
    invoiceId: number;
    username: string;
    amount?: number;
    action?: string;
  };
  read?: boolean;
} 