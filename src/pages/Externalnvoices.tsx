import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import ExternalInvoicesTable from "@/components/ExternalInvoicesTable";
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  RefreshCw,
  CheckCircle,
  Calendar,
  AlertCircle,
  Clock as ClockIcon,
  FileCheck,
  Download,
  Loader2
} from "lucide-react";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import { Link, useSearchParams } from "react-router-dom";
/* removed DateRange import - not used after quick preset approach */
import { RowSelectionState } from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageHeader from "@/components/PageHeader";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { notify } from "@/lib/notify";
import { MESSAGES } from "@/constants/messages";
import { apiClient } from "@/api/client";
import SavedViews from "@/components/SavedViews";
import { Skeleton } from "@/components/ui/skeleton";

const MetricItemSkeleton = () => (
  <div className="flex flex-col items-center">
    <Skeleton className="h-3 w-12 mb-1.5" />
    <Skeleton className="h-5 w-14" />
  </div>
);

const MetricItem = ({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  onClick, 
  showDot = false,
  tooltipText,
  suffix = ''
}: { 
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  showDot?: boolean;
  tooltipText: string;
  suffix?: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`flex flex-col items-center ${onClick ? 'cursor-pointer hover:bg-accent/50 rounded-lg px-2 py-1 transition-colors' : ''}`}
          onClick={onClick}
        >
          <span className="text-xs text-muted-foreground">{label}</span>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Icon className={`h-4 w-4 ${color}`} />
              {showDot && (
                <span className={`absolute -top-1 -right-1 h-2 w-2 ${color.replace('text', 'bg')} rounded-full`} />
              )}
            </div>
            <span className={`text-lg font-semibold ${color}`}>{value}{suffix}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function ExternalInvoicesPage() {
  const { user } = useAuth();
  const canViewTotals = can(user, 'billing.externalInvoices.viewTotals');
  const canPayExternalInvoices = can(user, 'billing.externalInvoices.pay');
  const canUploadInvoice = can(user, 'billing.invoiceUpload.create') && isFeatureEnabled('invoice-upload');

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const defaultPageSize = 200;
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfirmBulkPaidOpen, setIsConfirmBulkPaidOpen] = useState(false);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isBulkPaidInProgress, setIsBulkPaidInProgress] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState<any>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const savedViewsKeys = ["q", "from", "to", "status", "ps", "sort"];

  const dateRange = useMemo(() => {
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    if (!fromStr || !toStr) return undefined;
    const from = new Date(`${fromStr}T00:00:00`);
    const to = new Date(`${toStr}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return undefined;
    return { from, to };
  }, [searchParams]);

  // When opening the date dialog, start from current URL range.
  useEffect(() => {
    if (!isDateFilterOpen) return;
    setDraftDateRange(dateRange);
  }, [isDateFilterOpen, dateRange]);

  // Initialize state from URL/localStorage
  useEffect(() => {
    const q = searchParams.get('q') ?? localStorage.getItem('externalInvoices.search') ?? "";
    const psStr = searchParams.get('ps') ?? localStorage.getItem('externalInvoices.pageSize') ?? String(defaultPageSize);
    const ps = parseInt(psStr, 10) || defaultPageSize;
    setSearchTerm(q);
    setSearchInput(q);
    setPageSize(ps);
    // Restore from/to/status from localStorage if missing in URL
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlStatus = searchParams.get('status');
    const lsFrom = localStorage.getItem('externalInvoices.from') || undefined;
    const lsTo = localStorage.getItem('externalInvoices.to') || undefined;
    const lsStatus = localStorage.getItem('externalInvoices.status') || undefined;
    if ((!urlFrom && lsFrom) || (!urlTo && lsTo) || (!urlStatus && lsStatus)) {
      const next = new URLSearchParams(searchParams);
      if (!urlFrom && lsFrom) next.set('from', lsFrom);
      if (!urlTo && lsTo) next.set('to', lsTo);
      if (!urlStatus && lsStatus) next.set('status', lsStatus);
      setSearchParams(next, { replace: true } as any);
    }
    // currentPage is managed inside table; can be lifted later if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL/localStorage when search or pageSize change (and clear date/status when using search)
  useEffect(() => {
    // Use functional update so we never clobber newer URL params (e.g. month/date changes)
    // with a stale `searchParams` snapshot.
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (searchTerm) next.set('q', searchTerm); else next.delete('q');
      if (pageSize) next.set('ps', String(pageSize)); else next.delete('ps');
      if (searchTerm) {
        next.delete('from');
        next.delete('to');
        next.delete('status');
      }
      return next;
    }, { replace: true } as any);
    localStorage.setItem('externalInvoices.search', searchTerm);
    localStorage.setItem('externalInvoices.pageSize', String(pageSize));
  }, [searchTerm, pageSize]);

  // Persist from/to/status to localStorage whenever they change
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    if (from) localStorage.setItem('externalInvoices.from', from); else localStorage.removeItem('externalInvoices.from');
    if (to) localStorage.setItem('externalInvoices.to', to); else localStorage.removeItem('externalInvoices.to');
    if (status) localStorage.setItem('externalInvoices.status', status); else localStorage.removeItem('externalInvoices.status');
  }, [searchParams]);

  // React to URL changes (e.g., selecting a saved view): sync q/ps into state
  useEffect(() => {
    const qParam = searchParams.get('q') ?? '';
    if (qParam !== searchTerm) {
      setSearchInput(qParam);
      setSearchTerm(qParam);
      setCurrentPage(1);
    }
    const psParam = searchParams.get('ps');
    if (psParam) {
      const psNum = parseInt(psParam, 10);
      if (!Number.isNaN(psNum) && psNum !== pageSize) {
        setPageSize(psNum);
        setCurrentPage(1);
      }
    }
  }, [searchParams]);

  // Map 'overdue' to 'unpaid' for API (backend stores paid/unpaid/pending only)
  const apiStatus = searchParams.get('status') === 'overdue' ? 'unpaid' : (searchParams.get('status') || undefined);

  // Get quick stats for header
  const { data: statsData, isLoading: isStatsLoading, refetch, setInvoiceAsPaidMutation, bulkDeleteInvoicesMutation } = useExternalInvoices({ 
    initialPage: 1, 
    pageSize: 1,
    search: searchTerm,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    status: apiStatus,
  });

  // Get the full data for table with pagination
  const { data: allData } = useExternalInvoices({ 
    initialPage: currentPage, 
    pageSize: pageSize,
    search: searchTerm,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    status: apiStatus,
  });

  const handleSearch = useCallback((term: string) => {
    setSearchInput(term);
    // Clear URL-driven filters only when actually searching (non-empty term).
    // SearchBar will also call onSearch("") when the input is cleared or when
    // other controls programmatically clear the search input; we should NOT
    // wipe status/date filters in that case.
    if (term.trim()) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('from');
        next.delete('to');
        next.delete('status');
        return next;
      }, { replace: true } as any);
    }
  }, [setSearchParams]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // date range handler removed (using quick presets encoded in search string)

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    refetch();
  }, [refetch]);

  const handleQuickFilter = useCallback((filter: string) => {
    switch (filter) {
      case 'pending':
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('status', 'pending');
          return next;
        }, { replace: true } as any);
        break;
      case 'paid':
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('status', 'paid');
          return next;
        }, { replace: true } as any);
        break;
      case 'overdue':
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('status', 'overdue');
          return next;
        }, { replace: true } as any);
        break;
      case 'today':
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const today = new Date().toISOString().slice(0,10);
          const next = new URLSearchParams(prev);
          next.set('from', today);
          next.set('to', today);
          return next;
        }, { replace: true } as any);
        break;
      case 'last7d':
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const to = new Date();
          const from = new Date();
          from.setDate(to.getDate() - 6);
          const next = new URLSearchParams(prev);
          next.set('from', from.toISOString().slice(0,10));
          next.set('to', to.toISOString().slice(0,10));
          return next;
        }, { replace: true } as any);
        break;
      case 'last30d':
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const to = new Date();
          const from = new Date();
          from.setDate(to.getDate() - 29);
          const next = new URLSearchParams(prev);
          next.set('from', from.toISOString().slice(0,10));
          next.set('to', to.toISOString().slice(0,10));
          return next;
        }, { replace: true } as any);
        break;
      default:
        setSearchTerm('');
        setSearchInput('');
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('from');
          next.delete('to');
          next.delete('status');
          return next;
        }, { replace: true } as any);
    }
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((k) => parseInt(k, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [rowSelection]);

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
  }, [searchTerm, searchParams, apiStatus]);

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
  const selectedCount = selectedIds.length;

  return (
    <div className="w-full space-y-6 py-2 sm:py-2 px-2 sm:px-0 animate-in fade-in-50">
      <PageHeader
        title="External Invoices"
        subtitle="Manage and track all external invoices"
        icon={FileText}
        rightContent={(
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Compact status select on mobile */}
            <div className="flex sm:hidden items-center gap-2 w-full">
              <div className="text-sm text-muted-foreground">Status</div>
              <Select onValueChange={(val) => handleQuickFilter(val)}>
                <SelectTrigger className="h-8 w-full sm:w-[120px]">
                  <SelectValue placeholder={(searchParams.get('status') || 'all').toUpperCase()} />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Full status buttons on sm+ */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-sm text-muted-foreground mr-1">Status:</div>
              <Button
                variant={searchParams.get('status') === null ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleQuickFilter('all')}
                className={
                  (searchParams.get('status') === null ? 'text-white ' : 'text-foreground ') +
                  (searchParams.get('status') === null ? 'ring-2 ring-primary/40' : '')
                }
              >
                {searchParams.get('status') === null && <CheckCircle className="h-3 w-3 mr-1" />}
                All ({metrics?.totalInvoices ?? 0})
              </Button>
              <Button
                variant={searchParams.get('status') === 'pending' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleQuickFilter('pending')}
                className={
                  (searchParams.get('status') === 'pending' ? 'text-white ' : 'text-foreground ') +
                  (searchParams.get('status') === 'pending' ? 'ring-2 ring-primary/40' : '')
                }
              >
                {searchParams.get('status') === 'pending' && <CheckCircle className="h-3 w-3 mr-1" />}
                Pending ({metrics?.totalPending ?? 0})
              </Button>
              <Button
                variant={searchParams.get('status') === 'paid' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleQuickFilter('paid')}
                className={
                  (searchParams.get('status') === 'paid' ? 'text-white ' : 'text-foreground ') +
                  (searchParams.get('status') === 'paid' ? 'ring-2 ring-primary/40' : '')
                }
              >
                {searchParams.get('status') === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                Paid ({metrics?.totalPaid ?? 0})
              </Button>
              <Button
                variant={searchParams.get('status') === 'overdue' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleQuickFilter('overdue')}
                className={
                  (searchParams.get('status') === 'overdue' ? 'text-white ' : 'text-foreground ') +
                  (searchParams.get('status') === 'overdue' ? 'ring-2 ring-primary/40' : '')
                }
              >
                {searchParams.get('status') === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                Overdue ({metrics?.totalUnpaid ?? 0})
              </Button>
            </div>

            <div className="hidden md:block w-px h-6 bg-border mx-2" />
            {/* Saved Views: hide on small screens for cleaner mobile header */}
            <div className="hidden md:flex items-center gap-2">
              <SavedViews
                storageKey="externalInvoices.views"
                keys={savedViewsKeys}
                getState={() => ({
                  q: searchParams.get("q") || "",
                  from: searchParams.get("from") || "",
                  to: searchParams.get("to") || "",
                  status: searchParams.get("status") || "",
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
                  setSearchParams(next, { replace: true } as any);

                  // Force update both stats and table after applying a view
                  setRefreshKey((rk) => rk + 1);

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
        )}
        actions={(
          <div className="w-full sm:w-auto">
            <div className="flex gap-2 flex-col sm:flex-row w-full">
              <Button variant="outline" onClick={handleRefresh} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAll}
                disabled={isExportingAll || isStatsLoading}
                className="w-full sm:w-auto"
              >
                {isExportingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExportingAll ? "Exporting..." : "Export All"}
              </Button>
              {canUploadInvoice && (
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/invoice-upload">
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      />

      {/* Dashboard Controls Card */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Section */}
          <div className="flex-1 min-w-0 w-full lg:max-w-xl">
            <div className="flex items-center gap-2">
              <SearchBar 
                currentSearchTerm={searchInput} 
                onSearch={handleSearch}
                placeholder="Search invoices by ID, status, or amount..."
                className="w-full"
              />
              <Button
                variant="outline"
                size="icon"
                className={(searchParams.get("from") || searchParams.get("to")) ? "ring-2 ring-primary/30" : ""}
                onClick={() => setIsDateFilterOpen(true)}
                title="Date range filter"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="flex items-center gap-3 lg:gap-4 lg:border-l lg:border-border lg:pl-4 overflow-x-auto w-full lg:w-auto">
            {isStatsLoading ? (
              <>
                {canViewTotals && (
                  <div className="flex items-center gap-3">
                    <MetricItemSkeleton />
                    <MetricItemSkeleton />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MetricItemSkeleton />
                  <MetricItemSkeleton />
                </div>
                <div className="flex items-center gap-3">
                  <MetricItemSkeleton />
                  <MetricItemSkeleton />
                </div>
                <MetricItemSkeleton />
              </>
            ) : (
              <>
                {/* Amount Stats */}
                {canViewTotals ? (
                  <div className="flex items-center gap-3">
                    <MetricItem
                      label="Total Amount"
                      value={metrics?.totalAmount?.toLocaleString() ?? 0}
                      icon={DollarSign}
                      color="text-primary"
                      tooltipText={`Total value of all invoices: $${metrics?.totalAmount?.toLocaleString() ?? 0}`}
                      suffix="$"
                    />
                    <MetricItem
                      label="Average"
                      value={metrics?.totalAmount && metrics?.totalInvoices 
                        ? Math.round(metrics.totalAmount / metrics.totalInvoices).toLocaleString() 
                        : '0'}
                      icon={TrendingUp}
                      color="text-violet-600"
                      tooltipText="Average invoice amount"
                      suffix="$"
                    />
                  </div>
                ) : null}

                {/* Status Stats */}
                <div className="flex items-center gap-3">
                  <MetricItem
                    label="Paid"
                    value={`${metrics?.totalPaid ?? 0} (${metrics?.totalPaid && metrics?.totalInvoices 
                      ? Math.round((metrics.totalPaid / metrics.totalInvoices) * 100) 
                      : 0}%)`}
                    icon={CheckCircle}
                    color="text-green-600"
                    onClick={() => handleQuickFilter('paid')}
                    tooltipText="Click to filter paid invoices"
                  />
                  <MetricItem
                    label="Pending"
                    value={`${metrics?.totalPending ?? 0} (${metrics?.totalPending && metrics?.totalInvoices 
                      ? Math.round((metrics.totalPending / metrics.totalInvoices) * 100) 
                      : 0}%)`}
                    icon={ClockIcon}
                    color="text-orange-600"
                    onClick={() => handleQuickFilter('pending')}
                    tooltipText="Click to filter pending invoices"
                  />
                </div>

                {/* Additional Stats */}
                <div className="flex items-center gap-3">
                  <MetricItem
                    label="Unpaid"
                    value={`${metrics?.totalUnpaid ?? 0} (${metrics?.totalUnpaid && metrics?.totalInvoices 
                      ? Math.round((metrics.totalUnpaid / metrics.totalInvoices) * 100) 
                      : 0}%)`}
                    icon={AlertCircle}
                    color="text-yellow-600"
                    onClick={() => handleQuickFilter('overdue')}
                    tooltipText="Click to filter unpaid invoices"
                  />
                  <MetricItem
                    label="Selected"
                    value={`${selectedCount}${selectedCount > 0 ? ` (${Math.round((selectedCount / (metrics?.totalInvoices ?? 1)) * 100)}%)` : ''}`}
                    icon={CheckCircle}
                    color={selectedCount > 0 ? "text-blue-600" : "text-gray-400"}
                    tooltipText={selectedCount > 0 
                      ? `${selectedCount} invoices selected - Click to mark as paid` 
                      : "No invoices selected"}
                    onClick={(selectedCount > 0 && canPayExternalInvoices) ? () => setIsConfirmBulkPaidOpen(true) : undefined}
                    showDot={selectedCount > 0}
                  />
                </div>

                {/* Total Count */}
                <div className="flex items-center gap-3">
                  <MetricItem
                    label="Total"
                    value={metrics?.totalInvoices ?? 0}
                    icon={FileCheck}
                    color="text-blue-600"
                    tooltipText={`Total number of invoices: ${metrics?.totalInvoices ?? 0}`}
                  />
                </div>
              </>
            )}
          </div>
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
        {searchTerm && (
          <Badge variant="secondary" className="flex items-center gap-2">
            Search: “{searchTerm}”
            <Button variant="ghost" size="sm" onClick={() => { setSearchInput(''); setSearchTerm(''); }}>
              ×
            </Button>
          </Badge>
        )}
        {(searchParams.get('from') || searchParams.get('to') || searchParams.get('status') || searchTerm) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setSearchParams(prev => {
                const n = new URLSearchParams(prev);
                n.delete('from'); n.delete('to'); n.delete('status'); n.delete('q');
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
            <div className="flex items-center gap-2">
              {canPayExternalInvoices ? (
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsConfirmBulkPaidOpen(true)}
                  disabled={isBulkPaidInProgress}
                >
                  {isBulkPaidInProgress ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isBulkPaidInProgress ? "Marking..." : "Mark Paid"}
                </Button>
              ) : null}
              <Button
                variant="destructive"
                onClick={() => setIsConfirmBulkDeleteOpen(true)}
                disabled={bulkDeleteInvoicesMutation.isPending || isBulkPaidInProgress}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={handleExportSelected}
                disabled={isExportingAll}
              >
                <FileText className="h-4 w-4 mr-2" /> Export Selected
              </Button>
              <Button variant="ghost" onClick={() => setRowSelection({})}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Table */}
      <ExternalInvoicesTable 
        search={searchTerm} 
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
