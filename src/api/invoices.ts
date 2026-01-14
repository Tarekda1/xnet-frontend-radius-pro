import { apiClient } from './client';

export type CollectedMetrics = {
  totalCollectedInvoices: number;
  totalCashCollected: number;
};

export type CollectorBreakdown = Array<{
  collector: string;
  count: number;
  totalAmount: number;
}>;

export type CollectedInvoicesList = {
  data: Array<{
    id: number;
    amount: number;
    collectedBy: string | null;
    collectedAt: string | null;
    paymentMethod: string | null;
    cashReconciled?: boolean | 0 | 1 | '0' | '1' | null;
    reconciledBy?: string | null;
    reconciledAt?: string | null;
    username?: string;
    fullName?: string | null;
    status?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
  pageTotalAmount: number;
};

export async function fetchCollectedMetrics(params?: { dateFrom?: string; dateTo?: string }): Promise<CollectedMetrics> {
  const { data } = await apiClient.get('/invoices/collected/metrics', { params });
  return data.data as CollectedMetrics;
}

export async function fetchCollectorBreakdown(params?: { dateFrom?: string; dateTo?: string }): Promise<CollectorBreakdown> {
  const { data } = await apiClient.get('/invoices/collected/breakdown', { params });
  return data.data as CollectorBreakdown;
}

export async function fetchCollectedInvoicesList(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }): Promise<CollectedInvoicesList> {
  const { data } = await apiClient.get('/invoices/collected/list', { params });
  return data.data as CollectedInvoicesList;
}

export async function reconcileCollectedInvoice(invoiceId: number): Promise<void> {
  await apiClient.post(`/invoices/reconcile/${invoiceId}`);
}


