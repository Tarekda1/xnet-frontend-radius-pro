import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import ExternalInvoicesTable from "@/components/ExternalInvoicesTable";
import IconActionButton from "@/components/IconActionButton";
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
  X
} from "lucide-react";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  <div className="rounded-lg border p-3 space-y-1.5">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-5 w-16" />
  </div>
);

const CompactWidget = ({
  title,
  value,
  subtitle,
  icon: Icon, 
  colorClass,
  to,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
  to: string;
}) => (
  <Link to={to} className="group block rounded-lg border p-3 transition-colors hover:bg-accent/40">
    <div className="flex items-center justify-between">
      <span className="text-[11px] sm:text-xs text-muted-foreground">{title}</span>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </div>
    <div className={`mt-1 text-base sm:text-lg font-semibold ${colorClass}`}>{value}</div>
    {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
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
    incrementRefreshKey();
    refetch();
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
  }, [selectedIds, workflowMutation]);

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
        colorClass: "text-blue-600",
        to: buildWidgetHref("total-invoices"),
      },
      {
        key: "total-amount",
        title: "Total Amount",
        value: `$${totalAmount.toLocaleString()}`,
        subtitle: "Gross invoice value",
        icon: DollarSign,
        colorClass: "text-primary",
        to: buildWidgetHref("total-amount"),
      },
      {
        key: "average-amount",
        title: "Average",
        value: `$${Math.round(average).toLocaleString()}`,
        subtitle: "Average invoice amount",
        icon: DollarSign,
        colorClass: "text-violet-600",
        to: buildWidgetHref("average-amount"),
      },
      {
        key: "paid",
        title: "Paid",
        value: (metrics?.totalPaid ?? 0).toLocaleString(),
        subtitle: "Paid invoices",
        icon: CheckCircle,
        colorClass: "text-green-600",
        to: buildWidgetHref("paid", { status: "paid" }),
      },
      {
        key: "pending",
        title: "Pending",
        value: (metrics?.totalPending ?? 0).toLocaleString(),
        subtitle: "Pending invoices",
        icon: ClockIcon,
        colorClass: "text-orange-600",
        to: buildWidgetHref("pending", { status: "pending" }),
      },
      {
        key: "unpaid",
        title: "Unpaid",
        value: (metrics?.totalUnpaid ?? 0).toLocaleString(),
        subtitle: "Open/unpaid invoices",
        icon: AlertCircle,
        colorClass: "text-amber-600",
        to: buildWidgetHref("unpaid", { status: "unpaid" }),
      },
    ];
  }, [buildWidgetHref, metrics?.totalAmount, metrics?.totalInvoices, metrics?.totalPaid, metrics?.totalPending, metrics?.totalUnpaid]);

  return (
    <div className="w-full space-y-6 py-2 sm:py-2 px-2 sm:px-0 animate-in fade-in-50">
      <PageHeader
        title="External Invoices"
        subtitle={mode === "reconciliation" ? "Reconciliation view for external invoices" : "Manage and track all external invoices"}
        icon={FileText}
        rightContent={(
          <div className="w-full xl:min-w-[680px] space-y-2">
            <div
              className={
                isReconciliationMode
                  ? "grid grid-cols-1 gap-2 lg:grid-cols-[auto,1fr,auto,1fr] lg:items-center"
                  : "grid grid-cols-1 gap-2 lg:grid-cols-[auto,1fr] lg:items-center"
              }
            >
              <div className="text-xs text-muted-foreground whitespace-nowrap">Status</div>
              <FilterPills
                value={statusFilterValue}
                onChange={handleQuickFilter}
                options={statusFilterOptions}
                name="external-invoices-status"
                className="w-full min-w-0"
              />
              {isReconciliationMode ? (
                <>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">Aging</div>
                  <FilterPills
                    value={ageFilterValue}
                    onChange={handleAgeBucketFilter}
                    options={ageFilterOptions}
                    name="external-invoices-age"
                    className="w-full min-w-0"
                  />
                </>
              ) : null}
            </div>

            <div
              className={`flex flex-col gap-2 sm:flex-row sm:items-center ${
                isReconciliationMode ? "sm:justify-between" : "sm:justify-end"
              }`}
            >
              {isReconciliationMode ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{`Flags: ${flaggedCount}`}</div>
                  <div className="inline-flex items-center gap-2 rounded-md border bg-white/70 px-2 py-1 text-xs">
                    <span className="text-muted-foreground whitespace-nowrap">Avg overdue</span>
                    <span className="font-semibold whitespace-nowrap">{(agingSummary?.avgDaysOverdue ?? 0).toFixed(1)}d</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-md border bg-white/70 px-2 py-1 text-xs">
                    <span className="text-muted-foreground whitespace-nowrap">Overdue</span>
                    <span className="font-semibold whitespace-nowrap text-amber-700">
                      ${(agingSummary?.overdueAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="hidden lg:flex items-center gap-2">
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
                  applyState={(state) => {
                    const next = new URLSearchParams(searchParams);
                    savedViewsKeys.forEach((k) => {
                      const v = state[k];
                      if (v) next.set(k, v);
                      else next.delete(k);
                    });
                    if (!isReconciliationMode) next.delete("age");
                    setSearchParams(next, { replace: true } as any);

                    // Force update both stats and table after applying a view
                    incrementRefreshKey();

                    // Sync local states immediately for instant UI update
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
                  }}
                  onSaved={(name) => notify.success(MESSAGES.externalInvoices.viewSavedTitle, `Saved “${name}”.`)}
                  onDeleted={(name) => notify.success("View deleted", `Deleted “${name}”.`)}
                />
              </div>
            </div>
          </div>
        )}
        actions={(
          <div className="flex w-full flex-wrap justify-end gap-2">
            <IconActionButton
              label="Dunning Center"
              to="/external-invoices/dunning"
              icon={<AlertCircle className="h-4 w-4" />}
            />
            <IconActionButton
              label="Refresh"
              onClick={handleRefresh}
              icon={<RefreshCw className="h-4 w-4" />}
            />
            <IconActionButton
              label={isExportingAll ? "Exporting..." : "Export All"}
              onClick={handleExportAll}
              disabled={isExportingAll || isStatsLoading}
              icon={isExportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            />
            {canUploadInvoice ? (
              <IconActionButton
                label="New Invoice"
                to="/invoice-upload"
                variant="default"
                icon={<Plus className="h-4 w-4" />}
              />
            ) : null}
          </div>
        )}
      />

      {isReconciliationMode ? (
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Reconciliation mode
            </Badge>
            {reconciliationDataQuery.isLoading ? (
              <Badge variant="outline" className="text-xs">Scanning all filtered invoices...</Badge>
            ) : null}
            <FilterPills
              value={reconciliationFilter}
              onChange={(value) => setReconciliationFilter(value as any)}
              name="reconciliation-flags"
              options={[
                { value: "all", label: `All Flags (${flaggedCount})` },
                { value: "missing_payment", label: "Missing Payment" },
                { value: "duplicate", label: "Duplicate" },
                { value: "amount_mismatch", label: "Amount Mismatch" },
              ]}
            />
          </div>
        </Card>
      ) : null}

      {/* Dashboard Controls Card */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SearchBar 
              currentSearchTerm={searchInput} 
              onSearch={handleSearch}
              placeholder="Search invoices by ID, status, or amount..."
              className="w-full"
              autoSearch={false}
              showButton
            />
            <IconActionButton
              label="Date range filter"
              onClick={() => setIsDateFilterOpen(true)}
              icon={<Calendar className="h-4 w-4" />}
              className={(searchParams.get("from") || searchParams.get("to")) ? "ring-2 ring-primary/30" : ""}
            />
            <IconActionButton
              label={metricsCollapsed ? "Show metrics" : "Hide metrics"}
              onClick={() => setMetricsCollapsed((v) => !v)}
              icon={metricsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            />
          </div>

          {!metricsCollapsed ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2">
              {isStatsLoading ? (
                <>
                  <WidgetSkeleton />
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
                    <CompactWidget
                      key={widget.key}
                      title={widget.title}
                      value={widget.value}
                      subtitle={widget.subtitle}
                      icon={widget.icon}
                      colorClass={widget.colorClass}
                      to={widget.to}
                    />
                  ))
              )}
            </div>
          ) : null}
        </div>
      </Card>

      {/* Active filter chips (kept compact; date controls moved into popup) */}
      <div className="flex flex-wrap gap-2 items-center">
        {(searchParams.get('from') || searchParams.get('to')) && (
          <Badge variant="secondary" className="flex items-center gap-2 max-w-full">
            Date: {searchParams.get('from') || '…'} → {searchParams.get('to') || '…'}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.delete('from'); n.delete('to');
                  return n;
                }, { replace: true } as any);
                setCurrentPage(1);
              }}
            >
              ×
            </Button>
          </Badge>
        )}
        {searchParams.get('status') && (
          <Badge variant="secondary" className="flex items-center gap-2">
            Status: {searchParams.get('status')}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.delete('status');
                  return n;
                }, { replace: true } as any);
                setCurrentPage(1);
              }}
            >
              ×
            </Button>
          </Badge>
        )}
        {searchParams.get('age') && (
          <Badge variant="secondary" className="flex items-center gap-2">
            Aging: {searchParams.get('age')}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.delete('age');
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
            <Button variant="ghost" size="sm" onClick={() => { setSearchInput(''); setSearchTerm(''); }}>
              ×
            </Button>
          </Badge>
        )}
        {(searchParams.get('from') || searchParams.get('to') || searchParams.get('status') || searchParams.get('age') || searchTerm) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setSearchParams(prev => {
                const n = new URLSearchParams(prev);
                n.delete('from'); n.delete('to'); n.delete('status'); n.delete('age'); n.delete('q');
                return n;
              }, { replace: true } as any);
              setSearchInput("");
              setSearchTerm("");
              setCurrentPage(1);
            }}
          >
            Clear all
          </Button>
        )}
      </div>

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
        <Card className="border border-blue-200 bg-blue-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3">
            <div className="text-sm text-blue-800">
              {selectedCount} invoice{selectedCount > 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {canPayExternalInvoices ? (
                <IconActionButton
                  label={isBulkPaidInProgress ? "Marking paid..." : "Mark paid"}
                  onClick={() => setIsConfirmBulkPaidOpen(true)}
                  disabled={isBulkPaidInProgress}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  icon={isBulkPaidInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                />
              ) : null}
              <IconActionButton
                label="Send reminder"
                onClick={() => openReminderPreview(selectedInvoices)}
                disabled={sendRemindersMutation.isPending || selectedInvoices.length === 0}
                icon={<BellRing className="h-4 w-4" />}
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
                label="Set promise-to-pay date"
                onClick={() => {
                  const suggestion = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const date = window.prompt("Promise-to-pay date (YYYY-MM-DD)", suggestion);
                  if (date) handleSetPromiseDate(date);
                }}
                disabled={workflowMutation.isPending}
                icon={<Calendar className="h-4 w-4" />}
              />
              <IconActionButton
                label="Delete selected"
                onClick={() => setIsConfirmBulkDeleteOpen(true)}
                disabled={bulkDeleteInvoicesMutation.isPending || isBulkPaidInProgress}
                variant="destructive"
                icon={<Trash2 className="h-4 w-4" />}
              />
              <IconActionButton
                label="Export selected"
                onClick={handleExportSelected}
                disabled={isExportingAll}
                icon={<FileText className="h-4 w-4" />}
              />
              <IconActionButton
                label="Clear selection"
                onClick={() => setRowSelection({})}
                variant="ghost"
                icon={<X className="h-4 w-4" />}
              />
            </div>
          </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Reminder{reminderTargets.length > 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-muted-foreground">
              You are about to send {reminderTargets.length} WhatsApp reminder{reminderTargets.length > 1 ? "s" : ""}.
            </div>
            {reminderTargets[0] ? (
              <div className="rounded-md border p-3 bg-muted/30 text-xs whitespace-pre-wrap">
                {buildReminderMessagePreview(reminderTargets[0])}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReminderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendRemindersConfirm} disabled={sendRemindersMutation.isPending}>
              {sendRemindersMutation.isPending ? "Sending..." : "Send"}
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
