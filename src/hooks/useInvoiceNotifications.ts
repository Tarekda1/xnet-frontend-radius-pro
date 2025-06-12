import { useEffect, useState } from 'react';
import { websocketService } from '@/services/websocket';
import { InvoiceNotification } from '@/types/notifications';

const STORAGE_KEY = 'invoice_notifications';

export const useInvoiceNotifications = () => {
  const [notifications, setNotifications] = useState<InvoiceNotification[]>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect();

    // Subscribe to notifications
    const unsubscribe = websocketService.onNotification((data) => {
      console.log('Received notification inside useInvoiceNotifications:', data);
      let notification: InvoiceNotification;

      if (data.type === 'INVOICE_PAID') {
        notification = {
          message: `Invoice #${data.invoiceId} paid by ${data.username}`,
          timestamp: new Date().toISOString(),
          data: {
            invoiceId: data.invoiceId,
            username: data.username,
            amount: data.amount || 0,
          },
        };
      } else if (data.type === 'INVOICE_MODIFICATION') {
        notification = {
          message: data.message,
          timestamp: data.timestamp,
          data: {
            invoiceId: data.data.invoiceId,
            username: data.data.username,
            amount: 0,
          },
        };
      } else if (data.type === 'EXTERNAL_INVOICE_PAID') {
        notification = {
          message: data.message,
          timestamp: data.timestamp,
          data: {
            invoiceId: data.data.invoiceId,
            username: data.data.username,
            amount: data.data.amount || 0,
            action: 'PAID'
          },
        };
      } else {
        return; // Skip other notification types
      }

      setNotifications((prev) => {
        // Check if notification with same timestamp already exists
        const exists = prev.some(n => n.timestamp === notification.timestamp);
        if (exists) return prev;
        
        // Add new notification and keep last 10
        return [notification, ...prev].slice(0, 10);
      });
    },'EXTERNAL_INVOICE_PAID');

    // Cleanup on unmount
    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, []);

  return notifications;
}; 