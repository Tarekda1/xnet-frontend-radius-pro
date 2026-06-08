import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import ExternalInvoicesTable from "@/components/ExternalInvoicesTable";
import IconActionButton from "@/components/IconActionButton";
import StatCard from "@/components/StatCard";
import {
  Plus,
  FileText,
  DollarSign,
  RefreshCw,
  CheckCircle,
  BellRing,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Clock as ClockIcon,
  FileCheck,
  Download,
  Loader2,
  Trash2,
  X,
  ArrowUpRight,
  Scale,
  Receipt,
  MessageCircle,
} from "lucide-react";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import Link from "next/link";
import { useSearchParams } from "@/navigation/urlSearchParams";
import PageHeader from "@/components/PageHeader";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { notify } from "@/lib/notify";
import { MESSAGES } from "@/constants/messages";
import { apiClient } from "@/api/client";
import SavedViews from "@/components/SavedViews";
import { Skeleton } from "@/components/ui/skeleton";
import FilterPills from "@/components/FilterPills";
import { useExternalInvoicesPageState } from "./useExternalInvoicesPageState";
import { useExternalInvoicesUrlSync } from "./useExternalInvoicesUrlSync";
import { fetchExternalAgingSummary, setExternalInvoiceWorkflow } from "@/api/invoices";
import { buildReminderMessagePreview, getReconciliationFlagsMap, type ReconciliationFlag, type WorkflowStage } from "@/lib/externalInvoiceInsights";
import type { ExternalInvoice } from "@/types/api";

const WidgetSkeleton = () => (
  <Card className="border-border/60">
    <CardContent className="p-4 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </CardContent>
  </Card>
);

const InvoiceMetricLink = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClass = "text-blue-600 dark:text-blue-400",
  glowClass = "bg-blue-500",
  to,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  accentClass?: string;
  glowClass?: string;
  to: string;
}) => (
  <Link
    href={to}
    className="group relative block overflow-hidden rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md dark:bg-card/80"
  >
    <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08] ${glowClass}`} />
    <div className="relative flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{title}</span>
        <div className={`mt-1.5 text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${accentClass}`}>{value}</div>
        {subtitle ? <div className="mt-1 truncate text-[11px] text-muted-foreground">{subtitle}</div> : null}
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ${accentClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <ArrowUpRight className="absolute bottom-3 right-3 h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground" />
  </Link>
);

export function ExternalInvoicesPageImpl({ mode = "standard" }: { mode?: "standard" | "reconciliation" }) {
  const { user } = useAuth();
  const canViewTotals = can(user, 'billing.externalInvoices.viewTotals');
  const canPayExternalInvoices = can(user, 'billing.externalInvoices.pay');
  const canUploadInvoice = can(user, 'billing.invoiceUpload.create') && isFeatureEnabled('invoice-upload');

  const defaultPageSize = 200;
  const {
    searchTerm,
    searchInput,
    refreshKey,
    rowSelection,
    pageSize,
    currentPage,
    isConfirmBulkPaidOpen,
    isConfirmBulkDeleteOpen,
    isExportingAll,
    isBulkPaidInProgress,
    isDateFilterOpen,
    draftDateRange,
    setSearchTerm,
    setSearchInput,
    setPageSize,
    setCurrentPage,
    setIsConfirmBulkPaidOpen,
    setIsConfirmBulkDeleteOpen,
    setIsExportingAll,
    setIsBulkPaidInProgress,
    setIsDateFilterOpen,
    setDraftDateRange,
    incrementRefreshKey,
    setRowSelection,
  } = useExternalInvoicesPageState(defaultPageSize);
  const [searchParams, setSearchParams] = useSearchParams();
  const savedViewsKeys = useMemo(
    () => (mode === "reconciliation" ? ["q", "from", "to", "status", "age", "ps", "sort"] : ["q", "from", "to", "status", "ps", "sort"]),
    [mode]
  );
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [reminderTargets, setReminderTargets] = useState<ExternalInvoice[]>([]);
  const [isPromiseDialogOpen, setIsPromiseDialogOpen] = useState(false);
  const [promiseDate, setPromiseDate] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());
  const isReconciliationMode = mode === "reconciliation";
  const [reconciliationFilter, setReconciliationFilter] = useState<"all" | ReconciliationFlag>("all");
  const metricsCollapsedStorageKey = "ui.externalInvoices.metricsCollapsed";
  const [metricsCollapsed, setMetricsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(metricsCollapsedStorageKey) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(metricsCollapsedStorageKey, metricsCollapsed ? "1" : "0");
    } catch {}
  }, [metricsCollapsed]);
  const graceDays = 7;
  const { dateRange } = useExternalInvoicesUrlSync({
    defaultPageSize,
    searchParams,
    setSearchParams,
    searchTerm,
    pageSize,
    setSearchTerm,
    setSearchInput,
    setPageSize,
    setCurrentPage,
  });

  // When opening the date dialog, start from current URL range.
  useEffect(() => {
    if (!isDateFilterOpen) return;
    setDraftDateRange(dateRange);
  }, [isDateFilterOpen, dateRange]);

  // Map 'overdue' to 'unpaid' for API (backend stores paid/unpaid/pending only)
  const apiStatus = searchParams.get('status') === 'overdue' ? 'unpaid' : (searchParams.get('status') || undefined);
  const ageBucket = searchParams.get('age') || undefined;

  // Get quick stats for header
  const { data: statsData, isLoading: isStatsLoading, refetch, setInvoiceAsPaidMutation, bulkDeleteInvoicesMutation } = useExternalInvoices({ 
    initialPage: 1, 
    pageSize: 1,
    search: searchTerm,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    status: apiStatus,
    ageBucket,
    graceDays,
  });

  // Get the full data for table with pagination
  const { data: allData } = useExternalInvoices({ 
    initialPage: currentPage, 
    pageSize: pageSize,
    search: searchTerm,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    status: apiStatus,
    ageBucket,
    graceDays,
  });

  const reconciliationDataQuery = useQuery({
    queryKey: [
      "externalInvoicesReconciliationDataset",
      isReconciliationMode,
      searchTerm,
      searchParams.get("from"),
      searchParams.get("to"),
      apiStatus,
      ageBucket,
      graceDays,
    ],
    enabled: isReconciliationMode,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "500");
      if (searchTerm) params.set("search", searchTerm);
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (apiStatus && apiStatus !== "all") params.set("status", apiStatus);
      if (ageBucket && ageBucket !== "all") params.set("ageBucket", ageBucket);
      params.set("graceDays", String(graceDays));

      const first = await apiClient.get(`/invoices/external?${params.toString()}`);
      const payload = first?.data?.data ?? first?.data;
      const rows: ExternalInvoice[] = [...(payload?.data ?? [])];
      const totalPages = payload?.totalPages ?? 1;
      for (let p = 2; p <= totalPages; p++) {
        params.set("page", String(p));
        const next = await apiClient.get(`/invoices/external?${params.toString()}`);
        const nextPayload = next?.data?.data ?? next?.data;
        if (nextPayload?.data?.length) rows.push(...nextPayload.data);
      }
      return rows;
    },
  });

  const agingSummaryQuery = useQuery({
    queryKey: [
      "externalAgingSummary",
      searchTerm,
      searchParams.get("from"),
      searchParams.get("to"),
      apiStatus,
      graceDays,
    ],
    queryFn: () =>
      fetchExternalAgingSummary({
        search: searchTerm || undefined,
        from: searchParams.get("from") || undefined,
        to: searchParams.get("to") || undefined,
        status: apiStatus,
        graceDays,
      }),
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(ids.map((id) => apiClient.post(`/invoices/external/${id}/remind`)));
      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - sent;
      return { sent, failed };
    },
    onSuccess: (result) => {
      if (result.failed > 0) {
        notify.error("Reminder partial", `Sent ${result.sent}, failed ${result.failed}.`);
      } else {
        notify.success("Reminder sent", `Sent ${result.sent} reminder(s).`);
      }
      refetch();
    },
    onError: (e: unknown) => {
      notify.error("Reminder failed", e instanceof Error ? e.message : "Could not send reminder.");
    },
  });

  const workflowMutation = useMutation({
    mutationFn: async (payload: { invoiceId: number; stage: WorkflowStage; promiseDate?: string | null }) =>
      setExternalInvoiceWorkflow(payload.invoiceId, { stage: payload.stage, promiseDate: payload.promiseDate }),
    onSuccess: () => {
      notify.success("Workflow updated", "Collection workflow stage saved.");
      incrementRefreshKey();
      refetch();
    },
    onError: (e: unknown) => {
      notify.error("Workflow failed", e instanceof Error ? e.message : "Could not update workflow.");
    },
  });

  const handleSearch = useCallback((term: string) => {
    setSearchInput(term);
    setSearchTerm(term);
    setCurrentPage(1);
  }, [setSearchInput, setSearchTerm, setCurrentPage]);

  // date range handler removed (using quick presets encoded in search string)

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    incrementRefreshKey();
    setLastRefreshedAt(new Date());
    refetch().finally(() => {
      window.setTimeout(() => setIsRefreshing(false), 400);
    });
  }, [incrementRefreshKey, refetch]);

  const clearSearchFields = useCallback(() => {
    setSearchTerm("");
    setSearchInput("");
  }, [setSearchInput, setSearchTerm]);

  const updateSearchParams = useCallback((mutate: (next: URLSearchParams) => void) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      mutate(next);
      return next;
    }, { replace: true } as any);
  }, [setSearchParams]);

  const handleQuickFilter = useCallback((filter: string) => {
    const applyDateRange = (daysBackInclusive: number) => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - daysBackInclusive);
      updateSearchParams((next) => {
        next.set("from", from.toISOString().slice(0, 10));
        next.set("to", to.toISOString().slice(0, 10));
      });
    };

    clearSearchFields();
    switch (filter) {
      case 'pending':
        updateSearchParams((next) => {
          next.set("status", "pending");
          next.delete("age");
        });
        break;
      case 'paid':
        updateSearchParams((next) => {
          next.set("status", "paid");
          next.delete("age");
        });
        break;
      case 'overdue':
        updateSearchParams((next) => {
          next.set("status", "overdue");
          if (!next.get("age")) next.set("age", "1_30");
        });
        break;
      case 'today':
        updateSearchParams((next) => {
          const today = new Date().toISOString().slice(0, 10);
          next.set("from", today);
          next.set("to", today);
        });
        break;
      case 'last7d':
        applyDateRange(6);
        break;
      case 'last30d':
        applyDateRange(29);
        break;
      default:
        updateSearchParams((next) => {
          next.delete("from");
          next.delete("to");
          next.delete("status");
          next.delete("age");
        });
    }
    setCurrentPage(1); // Reset to first page on filter change
  }, [clearSearchFields, setCurrentPage, updateSearchParams]);

  const handleAgeBucketFilter = useCallback((bucket: string) => {
    updateSearchParams((next) => {
      if (!bucket || bucket === "all") next.delete("age");
      else next.set("age", bucket);
      if (!next.get("status")) next.set("status", "overdue");
    });
    setCurrentPage(1);
  }, [setCurrentPage, updateSearchParams]);

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((k) => parseInt(k, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [rowSelection]);

  const selectedInvoices = useMemo(() => {
    const rows = (allData?.data?.data ?? []) as ExternalInvoice[];
    const idSet = new Set(selectedIds);
    return rows.filter((inv) => idSet.has(inv.id));
  }, [allData?.data?.data, selectedIds]);

  const openReminderPreview = useCallback((targets: ExternalInvoice[]) => {
    if (!targets.length) {
      notify.error("No selection", "Select at least one invoice.");
      return;
    }
    setReminderTargets(targets);
    setIsReminderDialogOpen(true);
  }, []);

  const handleSendRemindersConfirm = useCallback(async () => {
    const ids = reminderTargets.map((x) => x.id);
    if (!ids.length) return;
    setIsReminderDialogOpen(false);
    await sendRemindersMutation.mutateAsync(ids);
  }, [reminderTargets, sendRemindersMutation]);

  const handleSetWorkflowStage = useCallback((invoiceId: number, stage: WorkflowStage) => {
    workflowMutation.mutate({ invoiceId, stage });
  }, [workflowMutation]);

  const handleSetPromiseDate = useCallback((date: string) => {
    if (!date || selectedIds.length === 0) return;
    selectedIds.forEach((invoiceId) => {
      workflowMutation.mutate({ invoiceId, stage: "promise_to_pay", promiseDate: date });
    });
    setIsPromiseDialogOpen(false);
  }, [selectedIds, workflowMutation]);

  const openPromiseDialog = useCallback(() => {
    const suggestion = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setPromiseDate(suggestion);
    setIsPromiseDialogOpen(true);
  }, []);

  const reconciliationRows = isReconciliationMode
    ? (reconciliationDataQuery.data ?? ((allData?.data?.data ?? []) as ExternalInvoice[]))
    : ((allData?.data?.data ?? []) as ExternalInvoice[]);
  const reconciliationFlagsMap = useMemo(
    () => getReconciliationFlagsMap(reconciliationRows),
    [reconciliationRows]
  );
  const flaggedCount = reconciliationFlagsMap.size;
  const rowPredicate = useMemo(() => {
    if (!isReconciliationMode || reconciliationFilter === "all") return undefined;
    return (inv: ExternalInvoice) => (reconciliationFlagsMap.get(inv.id) || []).includes(reconciliationFilter);
  }, [isReconciliationMode, reconciliationFilter, reconciliationFlagsMap]);

  const handleBulkPaid = useCallback(async () => {
    if (!canPayExternalInvoices || selectedIds.length === 0) return;
    setIsBulkPaidInProgress(true);
    try {
      await Promise.all(
        selectedIds
          .filter((id) => id)
          .map((id) =>
            setInvoiceAsPaidMutation.mutateAsync({ invoiceId: id, silent: true })
          )
      );
      refetch();
      setRowSelection({});
      notify.success(MESSAGES.externalInvoices.markingPaidTitle, `${selectedIds.length} invoice(s) marked as paid.`);
    } catch (e: unknown) {
      notify.error("Action failed", e instanceof Error ? e.message : "Some invoices could not be marked as paid.");
    } finally {
      setIsBulkPaidInProgress(false);
    }
  }, [selectedIds, setInvoiceAsPaidMutation, refetch, canPayExternalInvoices]);

  const handleExportSelected = useCallback(async () => {
    const selectedRows = (allData?.data?.data ?? []).filter((inv: any) => selectedIds.includes(inv.id)) as any[];
    if (!selectedRows.length) return;
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(selectedRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Selected Invoices");
    xlsx.writeFile(wb, "external_invoices_selected.xlsx");
    notify.success(MESSAGES.externalInvoices.exportedTitle, `${selectedRows.length} selected invoice(s) exported.`);
  }, [selectedIds, allData]);

  const handleExportAll = useCallback(async () => {
    setIsExportingAll(true);
    try {
      const exportPageSize = 500;
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", String(exportPageSize));
      if (searchTerm) params.set("search", searchTerm);
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (apiStatus && apiStatus !== "all") params.set("status", apiStatus);
      if (ageBucket && ageBucket !== "all") params.set("ageBucket", ageBucket);
      params.set("graceDays", String(graceDays));
      const sortParam = searchParams.get("sort") || "";
      const [sortBy, sortDir] = sortParam.split(":");
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);

      const first = await apiClient.get(`/invoices/external?${params.toString()}`);
      const payload = first?.data?.data ?? first?.data;
      const allRows: any[] = [...(payload?.data ?? [])];
      const totalPages = payload?.totalPages ?? 1;

      for (let p = 2; p <= totalPages; p++) {
        params.set("page", String(p));
        const next = await apiClient.get(`/invoices/external?${params.toString()}`);
        const nextPayload = next?.data?.data ?? next?.data;
        if (nextPayload?.data?.length) allRows.push(...nextPayload.data);
      }

      if (!allRows.length) {
        notify.error("Export failed", "No invoices to export.");
        return;
      }

      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet(allRows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "External Invoices");
      xlsx.writeFile(wb, `external_invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
      notify.success(MESSAGES.externalInvoices.exportedTitle, `${allRows.length} invoice(s) exported.`);
    } catch (e: unknown) {
      notify.error("Export failed", e instanceof Error ? e.message : "Could not export invoices.");
    } finally {
      setIsExportingAll(false);
    }
  }, [searchTerm, searchParams, apiStatus, ageBucket, graceDays]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      const result = await bulkDeleteInvoicesMutation.mutateAsync(selectedIds);
      // Ensure table + stats refresh
      refetch();
      setRowSelection({});

      if (result.failed.length > 0) {
        const first = result.failed[0];
        notify.error(
          MESSAGES.externalInvoices.partialDeleteTitle,
          `Deleted ${result.deletedIds.length}. Failed ${result.failed.length}. Example: #${first.id} (${first.reason})`
        );
      } else {
        notify.success(MESSAGES.externalInvoices.deletedTitle, `Deleted ${result.deletedIds.length} invoice(s).`);
      }
    } catch (e: any) {
      notify.error(MESSAGES.externalInvoices.deleteFailedTitle, e?.message || MESSAGES.common.deleteFailed);
    }
  }, [selectedIds, bulkDeleteInvoicesMutation, refetch]);

  // keep full export behavior but wire into bulk bar; not used directly here

  const metrics = statsData?.data?.metrics;
  const agingSummary = agingSummaryQuery.data;
  const selectedCount = selectedIds.length;
  const statusFilterValue = searchParams.get("status") || "all";
  const ageFilterValue = searchParams.get("age") || "all";
  const statusFilterOptions = useMemo(() => ([
    { value: "all", label: `All (${metrics?.totalInvoices ?? 0})` },
    { value: "pending", label: `Pending (${metrics?.totalPending ?? 0})` },
    { value: "paid", label: `Paid (${metrics?.totalPaid ?? 0})` },
    { value: "overdue", label: `Overdue (${metrics?.totalUnpaid ?? 0})` },
  ]), [metrics?.totalInvoices, metrics?.totalPaid, metrics?.totalPending, metrics?.totalUnpaid]);
  const ageFilterOptions = useMemo(() => {
    const bucketMap = new Map((agingSummary?.buckets || []).map((b) => [b.key, b]));
    return [
      { value: "all", label: "All Aging" },
      { value: "current", label: `Current (${bucketMap.get("current")?.count ?? 0})` },
      { value: "1_30", label: `1-30 (${bucketMap.get("1_30")?.count ?? 0})` },
      { value: "31_60", label: `31-60 (${bucketMap.get("31_60")?.count ?? 0})` },
      { value: "61_90", label: `61-90 (${bucketMap.get("61_90")?.count ?? 0})` },
      { value: "90_plus", label: `90+ (${bucketMap.get("90_plus")?.count ?? 0})` },
    ];
  }, [agingSummary?.buckets]);

  const buildWidgetHref = useCallback((widgetKey: string, extras?: Record<string, string>) => {
    const params = new URLSearchParams();
    const q = searchTerm.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const age = searchParams.get("age");
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    if (age) params.set("age", age);
    Object.entries(extras || {}).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const suffix = params.toString();
    return `/external-invoices/widgets/${widgetKey}${suffix ? `?${suffix}` : ""}`;
  }, [searchParams, searchTerm]);

  const compactWidgets = useMemo(() => {
    const totalInvoices = metrics?.totalInvoices ?? 0;
    const totalAmount = metrics?.totalAmount ?? 0;
    const average = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
    return [
      {
        key: "total-invoices",
        title: "Total Invoices",
        value: totalInvoices.toLocaleString(),
        subtitle: "All invoices in view",
        icon: FileCheck,
        accentClass: "text-blue-600 dark:text-blue-400",
        glowClass: "bg-blue-500",
        to: buildWidgetHref("total-invoices"),
      },
      {
        key: "total-amount",
        title: "Total Amount",
        value: `$${totalAmount.toLocaleString()}`,
        subtitle: "Gross invoice value",
        icon: DollarSign,
        accentClass: "text-emerald-600 dark:text-emerald-400",
        glowClass: "bg-emerald-500",
        to: buildWidgetHref("total-amount"),
      },
      {
        key: "average-amount",
        title: "Average",
        value: `$${Math.round(average).toLocaleString()}`,
        subtitle: "Average invoice amount",
        icon: Receipt,
        accentClass: "text-violet-600 dark:text-violet-400",
        glowClass: "bg-violet-500",
        to: buildWidgetHref("average-amount"),
      },
      {
        key: "paid",
        title: "Paid",
        value: (metrics?.totalPaid ?? 0).toLocaleString(),
        subtitle: "Paid invoices",
        icon: CheckCircle,
        accentClass: "text-green-600 dark:text-green-400",
        glowClass: "bg-green-500",
        to: buildWidgetHref("paid", { status: "paid" }),
      },
      {
        key: "pending",
        title: "Pending",
        value: (metrics?.totalPending ?? 0).toLocaleString(),
        subtitle: "Pending invoices",
        icon: ClockIcon,
        accentClass: "text-orange-600 dark:text-orange-400",
        glowClass: "bg-orange-500",
        to: buildWidgetHref("pending", { status: "pending" }),
      },
      {
        key: "unpaid",
        title: "Unpaid",
        value: (metrics?.totalUnpaid ?? 0).toLocaleString(),
        subtitle: "Open/unpaid invoices",
        icon: AlertCircle,
        accentClass: "text-amber-600 dark:text-amber-400",
        glowClass: "bg-amber-500",
        to: buildWidgetHref("unpaid", { status: "unpaid" }),
      },
    ];
  }, [buildWidgetHref, metrics?.totalAmount, metrics?.totalInvoices, metrics?.totalPaid, metrics?.totalPending, metrics?.totalUnpaid]);

  const totalInvoices = metrics?.totalInvoices ?? 0;
  const hasActiveFilters = Boolean(
    searchParams.get("from") ||
      searchParams.get("to") ||
      searchParams.get("status") ||
      searchParams.get("age") ||
      searchTerm
  );

  const applySavedView = useCallback((state: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    savedViewsKeys.forEach((k) => {
      const v = state[k];
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!isReconciliationMode) next.delete("age");
    setSearchParams(next, { replace: true } as any);
    incrementRefreshKey();
    if (typeof state.q === "string") {
      setSearchInput(state.q);
      setSearchTerm(state.q);
    }
    if (state.ps) {
      const psNum = parseInt(state.ps, 10);
      if (!Number.isNaN(psNum)) setPageSize(psNum);
    }
    setCurrentPage(1);
    refetch();
  }, [
    incrementRefreshKey,
    isReconciliationMode,
    refetch,
    savedViewsKeys,
    searchParams,
    setCurrentPage,
    setPageSize,
    setSearchInput,
    setSearchParams,
    setSearchTerm,
  ]);

  return (
    <div className="w-full space-y-6 py-6 px-4 sm:px-0 animate-in fade-in-50">
      <PageHeader
        variant="gradient"
        title={isReconciliationMode ? "Invoice Reconciliation" : "External Invoices"}
        subtitle={
          isReconciliationMode
            ? "Find duplicates, amount mismatches, and missing payments across imported invoices."
            : "Search, collect, and send WhatsApp reminders for external billing."
        }
        icon={isReconciliationMode ? Scale : FileText}
        actions={(
          <div className="flex w-full flex-wrap justify-end gap-2">
            <IconActionButton
              label={isRefreshing ? "Refreshing..." : "Refresh"}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-white/25 bg-white/15 text-white shadow-sm hover:bg-white/25"
              icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />}
            />
            <IconActionButton
              label={isExportingAll ? "Exporting..." : "Export all"}
              onClick={handleExportAll}
              disabled={isExportingAll || isStatsLoading}
              className="border-white/25 bg-white/15 text-white shadow-sm hover:bg-white/25"
              icon={isExportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            />
            {canUploadInvoice ? (
              <IconActionButton
                label="Upload"
                to="/invoice-upload"
                className="border-white/25 bg-white text-slate-900 shadow-sm hover:bg-white/90"
                icon={<Plus className="h-4 w-4" />}
              />
            ) : null}
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
          <Link href="/external-invoices/dunning">
            <AlertCircle className="mr-2 h-4 w-4" />
            Dunning center
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
          <Link href="/external-invoices/payment-due">
            <Calendar className="mr-2 h-4 w-4" />
            Payment due
          </Link>
        </Button>
        {!isReconciliationMode ? (
          <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
            <Link href="/external-invoices/reconciliation">
              <Scale className="mr-2 h-4 w-4" />
              Reconciliation
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
            <Link href="/external-invoices">
              <FileText className="mr-2 h-4 w-4" />
              Standard view
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isStatsLoading ? (
          <>
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total invoices"
              value={totalInvoices.toLocaleString()}
              sublabel="In current filter scope"
              icon={
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              }
            />
            <StatCard
              label="Unpaid / overdue"
              value={(metrics?.totalUnpaid ?? 0).toLocaleString()}
              sublabel={
                agingSummary?.overdueAmount
                  ? `$${agingSummary.overdueAmount.toLocaleString()} overdue`
                  : "Open balances"
              }
              icon={
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              }
            />
            <StatCard
              label="Pending"
              value={(metrics?.totalPending ?? 0).toLocaleString()}
              sublabel="Awaiting payment confirmation"
              icon={
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              }
            />
            <StatCard
              label="Paid"
              value={(metrics?.totalPaid ?? 0).toLocaleString()}
              sublabel={
                totalInvoices > 0
                  ? `${Math.round(((metrics?.totalPaid ?? 0) / totalInvoices) * 100)}% collected`
                  : "Collected invoices"
              }
              icon={
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              }
            />
          </>
        )}
      </div>

      {isReconciliationMode ? (
        <Card className="overflow-hidden border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-amber-50/40 dark:border-orange-900/40 dark:from-orange-950/30 dark:to-amber-950/20">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Badge variant="outline" className="border-orange-300 bg-orange-100/80 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200">
              Reconciliation mode
            </Badge>
            {reconciliationDataQuery.isLoading ? (
              <Badge variant="outline" className="text-xs">Scanning all filtered invoices…</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">{flaggedCount} flagged invoice{flaggedCount === 1 ? "" : "s"}</span>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border border-border/70 bg-background/80 px-2.5 py-1">
                Avg overdue <strong className="ml-1">{(agingSummary?.avgDaysOverdue ?? 0).toFixed(1)}d</strong>
              </span>
              <span className="rounded-md border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                Overdue <strong className="ml-1">${(agingSummary?.overdueAmount ?? 0).toLocaleString()}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      ) : agingSummary && !isStatsLoading ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Aging snapshot:</span>
          <span>Avg overdue <strong>{(agingSummary.avgDaysOverdue ?? 0).toFixed(1)} days</strong></span>
          <span className="text-muted-foreground">·</span>
          <span className="text-amber-700 dark:text-amber-300">
            ${(agingSummary.overdueAmount ?? 0).toLocaleString()} overdue
          </span>
        </div>
      ) : null}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar
              currentSearchTerm={searchInput}
              onSearch={handleSearch}
              placeholder="Search invoice ID, username, name, address, status, or amount…"
              className="w-full flex-1"
              autoSearch={false}
              showButton
            />
            <div className="flex flex-wrap items-center gap-2">
              <IconActionButton
                label="Date range"
                onClick={() => setIsDateFilterOpen(true)}
                icon={<Calendar className="h-4 w-4" />}
                className={(searchParams.get("from") || searchParams.get("to")) ? "ring-2 ring-primary/30" : ""}
              />
              <div className="hidden lg:block">
                <SavedViews
                  storageKey="externalInvoices.views"
                  keys={savedViewsKeys}
                  getState={() => ({
                    q: searchParams.get("q") || "",
                    from: searchParams.get("from") || "",
                    to: searchParams.get("to") || "",
                    status: searchParams.get("status") || "",
                    age: isReconciliationMode ? (searchParams.get("age") || "") : "",
                    ps: searchParams.get("ps") || "",
                    sort: searchParams.get("sort") || "",
                  })}
                  applyState={applySavedView}
                  onSaved={(name) => notify.success(MESSAGES.externalInvoices.viewSavedTitle, `Saved “${name}”.`)}
                  onDeleted={(name) => notify.success("View deleted", `Deleted “${name}”.`)}
                />
              </div>
              <IconActionButton
                label={metricsCollapsed ? "Show breakdown" : "Hide breakdown"}
                onClick={() => setMetricsCollapsed((v) => !v)}
                icon={metricsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</div>
            <FilterPills
              value={statusFilterValue}
              onChange={handleQuickFilter}
              options={statusFilterOptions}
              name="external-invoices-status"
              className="w-full min-w-0"
            />
          </div>

          {isReconciliationMode ? (
            <>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aging bucket</div>
                <FilterPills
                  value={ageFilterValue}
                  onChange={handleAgeBucketFilter}
                  options={ageFilterOptions}
                  name="external-invoices-age"
                  className="w-full min-w-0"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reconciliation flags</div>
                <FilterPills
                  value={reconciliationFilter}
                  onChange={(value) => setReconciliationFilter(value as ReconciliationFlag | "all")}
                  name="reconciliation-flags"
                  options={[
                    { value: "all", label: `All flags (${flaggedCount})` },
                    { value: "missing_payment", label: "Missing payment" },
                    { value: "duplicate", label: "Duplicate" },
                    { value: "amount_mismatch", label: "Amount mismatch" },
                  ]}
                />
              </div>
            </>
          ) : null}

          {(hasActiveFilters || lastRefreshedAt) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              {lastRefreshedAt ? (
                <span className="text-xs text-muted-foreground">
                  Updated {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}
              {(searchParams.get("from") || searchParams.get("to")) && (
                <Badge variant="secondary" className="flex max-w-full items-center gap-2">
                  Date: {searchParams.get("from") || "…"} → {searchParams.get("to") || "…"}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const n = new URLSearchParams(prev);
                        n.delete("from");
                        n.delete("to");
                        return n;
                      }, { replace: true } as any);
                      setCurrentPage(1);
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {searchParams.get("status") && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  Status: {searchParams.get("status")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const n = new URLSearchParams(prev);
                        n.delete("status");
                        return n;
                      }, { replace: true } as any);
                      setCurrentPage(1);
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {searchParams.get("age") && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  Aging: {searchParams.get("age")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const n = new URLSearchParams(prev);
                        n.delete("age");
                        return n;
                      }, { replace: true } as any);
                      setCurrentPage(1);
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  Search: “{searchTerm}”
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={clearSearchFields}>
                    ×
                  </Button>
                </Badge>
              )}
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchParams((prev) => {
                      const n = new URLSearchParams(prev);
                      n.delete("from");
                      n.delete("to");
                      n.delete("status");
                      n.delete("age");
                      n.delete("q");
                      return n;
                    }, { replace: true } as any);
                    clearSearchFields();
                    setCurrentPage(1);
                  }}
                >
                  Clear all filters
                </Button>
              ) : null}
            </div>
          )}

          {!metricsCollapsed ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {isStatsLoading ? (
                <>
                  <WidgetSkeleton />
                  <WidgetSkeleton />
                  <WidgetSkeleton />
                  <WidgetSkeleton />
                  <WidgetSkeleton />
                  <WidgetSkeleton />
                </>
              ) : (
                compactWidgets
                  .filter((widget) => canViewTotals || (widget.key !== "total-amount" && widget.key !== "average-amount"))
                  .map((widget) => (
                    <InvoiceMetricLink
                      key={widget.key}
                      title={widget.title}
                      value={widget.value}
                      subtitle={widget.subtitle}
                      icon={widget.icon}
                      accentClass={widget.accentClass}
                      glowClass={widget.glowClass}
                      to={widget.to}
                    />
                  ))
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Date filter popup (saves vertical space) */}
      <Dialog open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Date filter</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <DateRangePicker
              className="w-full"
              dateRange={draftDateRange}
              onDateRangeChange={(range) => {
                // Important: keep a local draft so users can pick "from" then "to"
                // without the picker snapping back to the URL-controlled value.
                setDraftDateRange(range);
              }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { handleQuickFilter('today'); setDraftDateRange(undefined); setIsDateFilterOpen(false); }}>
                Today
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { handleQuickFilter('last7d'); setDraftDateRange(undefined); setIsDateFilterOpen(false); }}>
                Last 7 Days
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { handleQuickFilter('last30d'); setDraftDateRange(undefined); setIsDateFilterOpen(false); }}>
                Last 30 Days
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Month</span>
              <Input
                type="month"
                className="w-[160px]"
                value={(() => {
                  const from = searchParams.get('from');
                  const to = searchParams.get('to');
                  if (!from || !to) return '';
                  try {
                    const y = parseInt(from.slice(0,4), 10);
                    const m = parseInt(from.slice(5,7), 10);
                    const first = `${y}-${String(m).padStart(2,'0')}-01`;
                    const last = new Date(y, m, 0).toISOString().slice(0,10);
                    if (from === first && to === last) return from.slice(0,7);
                  } catch {}
                  return '';
                })()}
                onChange={(e) => {
                  const val = e.target.value; // YYYY-MM
                  const next = new URLSearchParams(searchParams);
                  if (!val) {
                    next.delete('from'); next.delete('to');
                  } else {
                    const [yy, mm] = val.split('-').map(x => parseInt(x, 10));
                    const from = `${yy}-${String(mm).padStart(2,'0')}-01`;
                    const to = new Date(yy, mm, 0).toISOString().slice(0,10);
                    next.set('from', from);
                    next.set('to', to);
                  }
                  setSearchParams(next, { replace: true } as any);
                  setSearchInput("");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setSearchParams(prev => {
                const n = new URLSearchParams(prev);
                n.delete('from'); n.delete('to');
                return n;
              }, { replace: true } as any);
              setDraftDateRange(undefined);
              setCurrentPage(1);
            }}>
              Clear dates
            </Button>
            <Button
              onClick={() => {
                if (draftDateRange?.from && draftDateRange?.to) {
                  const from = draftDateRange.from.toISOString().slice(0,10);
                  const to = draftDateRange.to.toISOString().slice(0,10);
                  const next = new URLSearchParams(searchParams);
                  next.set('from', from);
                  next.set('to', to);
                  setSearchParams(next, { replace: true } as any);
                  setSearchInput("");
                  setSearchTerm("");
                  setCurrentPage(1);
                }
                setIsDateFilterOpen(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contextual bulk actions bar */}
      {selectedCount > 0 && (
        <Card className="sticky top-2 z-10 overflow-hidden border-primary/20 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-violet-50/50 shadow-md dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {selectedCount} invoice{selectedCount > 1 ? "s" : ""} selected
                </div>
                <div className="text-xs text-muted-foreground">
                  Bulk actions apply to the current page selection
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {canPayExternalInvoices ? (
                <IconActionButton
                  label={isBulkPaidInProgress ? "Marking paid…" : "Mark paid"}
                  onClick={() => setIsConfirmBulkPaidOpen(true)}
                  disabled={isBulkPaidInProgress}
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  icon={isBulkPaidInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                />
              ) : null}
              <IconActionButton
                label="WhatsApp reminder"
                onClick={() => openReminderPreview(selectedInvoices)}
                disabled={sendRemindersMutation.isPending || selectedInvoices.length === 0}
                className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                icon={<MessageCircle className="h-4 w-4" />}
              />
              <IconActionButton
                label="Escalate"
                onClick={() => {
                  selectedIds.forEach((invoiceId) => handleSetWorkflowStage(invoiceId, "escalated"));
                }}
                disabled={workflowMutation.isPending}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <IconActionButton
                label="Promise to pay"
                onClick={openPromiseDialog}
                disabled={workflowMutation.isPending}
                icon={<Calendar className="h-4 w-4" />}
              />
              <IconActionButton
                label="Export"
                onClick={handleExportSelected}
                disabled={isExportingAll}
                icon={<Download className="h-4 w-4" />}
              />
              <IconActionButton
                label="Delete"
                onClick={() => setIsConfirmBulkDeleteOpen(true)}
                disabled={bulkDeleteInvoicesMutation.isPending || isBulkPaidInProgress}
                variant="destructive"
                icon={<Trash2 className="h-4 w-4" />}
              />
              <IconActionButton
                label="Clear"
                onClick={() => setRowSelection({})}
                variant="ghost"
                icon={<X className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <ExternalInvoicesTable 
        search={searchTerm} 
        ageBucket={ageBucket}
        graceDays={graceDays}
        reconciliationMode={isReconciliationMode}
        reconciliationFlags={reconciliationFlagsMap}
        rowPredicate={rowPredicate}
        onSetWorkflowStage={handleSetWorkflowStage}
        onSendReminderRequest={(invoice) => openReminderPreview([invoice])}
        key={refreshKey}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        hideBulkActions={true}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onFirstPage={() => setCurrentPage(1)}
        onLastPage={() => allData?.data?.totalPages && setCurrentPage(allData.data.totalPages)}
        totalItems={allData?.data?.total || 0}
      />

      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              Send WhatsApp reminder{reminderTargets.length > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              {reminderTargets.length === 1
                ? "Review the message preview before sending to the customer."
                : `You are about to send ${reminderTargets.length} reminders. Preview shows the first invoice.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {reminderTargets.length > 1 ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recipients</div>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                  {reminderTargets.slice(0, 12).map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">#{inv.id} · {inv.username || inv.fullName || "—"}</span>
                      <span className="shrink-0 text-muted-foreground">${Number(inv.amount ?? 0).toLocaleString()}</span>
                    </li>
                  ))}
                  {reminderTargets.length > 12 ? (
                    <li className="text-muted-foreground">+ {reminderTargets.length - 12} more</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            {reminderTargets[0] ? (
              <div className="overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 border-b border-emerald-200/60 bg-emerald-100/60 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message preview
                </div>
                <div className="whitespace-pre-wrap p-3 text-xs leading-relaxed text-foreground/90">
                  {buildReminderMessagePreview(reminderTargets[0])}
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              The actual WhatsApp text is defined by your Twilio reminder template (not this preview).
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReminderDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendRemindersConfirm}
              disabled={sendRemindersMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sendRemindersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <BellRing className="mr-2 h-4 w-4" />
                  Send {reminderTargets.length > 1 ? `${reminderTargets.length} reminders` : "reminder"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromiseDialogOpen} onOpenChange={setIsPromiseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promise to pay</DialogTitle>
            <DialogDescription>
              Set a follow-up date for {selectedCount} selected invoice{selectedCount > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="promise-date">Expected payment date</Label>
            <Input
              id="promise-date"
              type="date"
              value={promiseDate}
              onChange={(e) => setPromiseDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPromiseDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleSetPromiseDate(promiseDate)}
              disabled={!promiseDate || workflowMutation.isPending}
            >
              {workflowMutation.isPending ? "Saving…" : "Save date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm bulk paid dialog */}
      <Dialog open={isConfirmBulkPaidOpen} onOpenChange={setIsConfirmBulkPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark selected invoices as paid?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This will mark {selectedCount} invoice{selectedCount > 1 ? 's' : ''} as paid. You can’t undo this action.
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfirmBulkPaidOpen(false)}>Cancel</Button>
            <Button 
              onClick={async () => {
                setIsConfirmBulkPaidOpen(false);
                setIsBulkPaidInProgress(true);
                await handleBulkPaid();
              }}
              disabled={!canPayExternalInvoices || isBulkPaidInProgress}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm bulk delete dialog */}
      <Dialog open={isConfirmBulkDeleteOpen} onOpenChange={setIsConfirmBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected invoices?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>
              This will permanently delete <b>{selectedCount}</b> invoice{selectedCount > 1 ? 's' : ''}. This action cannot be undone.
            </div>
            <div className="text-xs">
              Example IDs: {selectedIds.slice(0, 6).map((id) => `#${id}`).join(", ")}{selectedIds.length > 6 ? "…" : ""}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfirmBulkDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsConfirmBulkDeleteOpen(false);
                await handleBulkDelete();
              }}
              disabled={bulkDeleteInvoicesMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExternalInvoicesPage() {
  return <ExternalInvoicesPageImpl mode="standard" />;
}
