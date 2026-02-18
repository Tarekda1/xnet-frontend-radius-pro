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

export type DunningCandidate = {
  id: number;
  username: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  billingMonth: string;
  amount: number;
  overdueDays: number;
  dueDate: string;
  stage?: {
    day: number;
    action: "remind" | "throttle" | "suspend";
    name?: string;
  } | null;
};

export type DunningStage = {
  day: number;
  action: "remind" | "throttle" | "suspend";
  name?: string;
};

export type DunningPreviewResponse = {
  graceDays: number;
  asOfDate?: string | null;
  statuses: string[];
  stages?: DunningStage[];
  selectedActions?: Array<"remind" | "throttle" | "suspend">;
  totalCandidates: number;
  readyToSend: number;
  missingPhone: number;
  totalAmount: number;
  actionSummary?: {
    remind: number;
    throttle: number;
    suspend: number;
    none: number;
  };
  data: DunningCandidate[];
};

export type DunningRunResponse = {
  dryRun: boolean;
  attempted: number;
  sent: number;
  skippedNoPhone: number;
  skippedAlreadyApplied?: number;
  failed: number;
  actionSummary?: {
    remind: number;
    throttle: number;
    suspend: number;
    none: number;
  };
  details: Array<{ id: number; status: "sent" | "skipped" | "failed"; action?: "remind" | "throttle" | "suspend"; stageDay?: number; reason?: string }>;
};

export async function fetchExternalDunningPreview(params?: {
  graceDays?: number;
  limit?: number;
  minAmount?: number;
  statuses?: string[];
  stages?: DunningStage[];
  asOfDate?: string;
  selectedActions?: Array<"remind" | "throttle" | "suspend">;
}): Promise<DunningPreviewResponse> {
  const normalized = {
    graceDays: params?.graceDays ?? 7,
    limit: params?.limit ?? 100,
    minAmount: params?.minAmount ?? 0,
    statuses: (params?.statuses ?? ["unpaid", "pending"]).join(","),
    stages: JSON.stringify(params?.stages ?? []),
    asOfDate: params?.asOfDate,
    selectedActions: (params?.selectedActions ?? []).join(","),
  };
  const { data } = await apiClient.get("/invoices/external/dunning/preview", { params: normalized });
  return data.data as DunningPreviewResponse;
}

export async function runExternalDunningCampaign(payload?: {
  graceDays?: number;
  maxCount?: number;
  minAmount?: number;
  dryRun?: boolean;
  statuses?: string[];
  stages?: DunningStage[];
  throttleProfileId?: number;
  asOfDate?: string;
  selectedActions?: Array<"remind" | "throttle" | "suspend">;
}): Promise<DunningRunResponse> {
  const body = {
    graceDays: payload?.graceDays ?? 7,
    maxCount: payload?.maxCount ?? 100,
    minAmount: payload?.minAmount ?? 0,
    dryRun: payload?.dryRun ?? false,
    statuses: (payload?.statuses ?? ["unpaid", "pending"]).join(","),
    stages: payload?.stages ?? [],
    throttleProfileId: payload?.throttleProfileId,
    asOfDate: payload?.asOfDate,
    selectedActions: (payload?.selectedActions ?? []).join(","),
  };
  const { data } = await apiClient.post("/invoices/external/dunning/run", body);
  return data.data as DunningRunResponse;
}


