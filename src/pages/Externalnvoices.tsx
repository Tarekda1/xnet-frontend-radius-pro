import React, { useCallback, useEffect, useMemo } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const savedViewsKeys = ["q", "from", "to", "status", "ps", "sort"];
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
  }, [setSearchInput, setSearchParams]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

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
        updateSearchParams((next) => next.set("status", "pending"));
        break;
      case 'paid':
        updateSearchParams((next) => next.set("status", "paid"));
        break;
      case 'overdue':
        updateSearchParams((next) => next.set("status", "overdue"));
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
        });
    }
    setCurrentPage(1); // Reset to first page on filter change
  }, [clearSearchFields, setCurrentPage, updateSearchParams]);

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
  const statusFilterValue = searchParams.get("status") || "all";
  const statusFilterOptions = useMemo(() => ([
    { value: "all", label: `All (${metrics?.totalInvoices ?? 0})` },
    { value: "pending", label: `Pending (${metrics?.totalPending ?? 0})` },
    { value: "paid", label: `Paid (${metrics?.totalPaid ?? 0})` },
    { value: "overdue", label: `Overdue (${metrics?.totalUnpaid ?? 0})` },
  ]), [metrics?.totalInvoices, metrics?.totalPaid, metrics?.totalPending, metrics?.totalUnpaid]);

  return (
    <div className="w-full space-y-6 py-2 sm:py-2 px-2 sm:px-0 animate-in fade-in-50">
      <PageHeader
        title="External Invoices"
        subtitle="Manage and track all external invoices"
        icon={FileText}
        rightContent={(
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <div className="text-sm text-muted-foreground whitespace-nowrap">Status:</div>
              <FilterPills
                value={statusFilterValue}
                onChange={handleQuickFilter}
                options={statusFilterOptions}
                name="external-invoices-status"
                className="w-full sm:w-auto"
              />
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
        )}
        actions={(
          <div className="w-full sm:w-auto">
            <div className="flex gap-2 flex-col sm:flex-row w-full">
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link to="/external-invoices/dunning">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Dunning Center
                </Link>
              </Button>
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
            <div className="flex items-center flex-wrap gap-1.5">
              {canPayExternalInvoices ? (
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsConfirmBulkPaidOpen(true)}
                  disabled={isBulkPaidInProgress}
                >
                  {isBulkPaidInProgress ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  )}
                  {isBulkPaidInProgress ? "Marking..." : "Mark Paid"}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-2 text-xs"
                onClick={() => setIsConfirmBulkDeleteOpen(true)}
                disabled={bulkDeleteInvoicesMutation.isPending || isBulkPaidInProgress}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={handleExportSelected}
                disabled={isExportingAll}
              >
                <FileText className="h-3.5 w-3.5 mr-1" /> Export Selected
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setRowSelection({})}>
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
