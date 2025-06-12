import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import ExternalInvoicesTable from "@/components/ExternalInvoicesTable";
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  FileCheck
} from "lucide-react";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import { DateRange } from "react-day-picker";
import { utils, writeFile } from "xlsx";
import { RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Get quick stats for header
  const { data: statsData, refetch, setInvoiceAsPaidMutation } = useExternalInvoices({ 
    initialPage: 1, 
    pageSize: 1,
    search: "" 
  });

  // Get the full data for table with pagination
  const { data: allData } = useExternalInvoices({ 
    initialPage: currentPage, 
    pageSize: pageSize,
    search: searchTerm 
  });

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1); // Reset to first page on date change
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    refetch();
  }, [refetch]);

  const handleQuickFilter = useCallback((filter: string) => {
    switch (filter) {
      case 'pending':
        setSearchTerm('status:pending');
        break;
      case 'paid':
        setSearchTerm('status:paid');
        break;
      case 'overdue':
        setSearchTerm('status:overdue');
        break;
      case 'today':
        const today = new Date();
        setDateRange({ from: today, to: today });
        break;
      default:
        setSearchTerm('');
        setDateRange(undefined);
    }
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handleBulkPaid = useCallback(() => {
    const selectedIds = Object.keys(rowSelection).map(key => {
      const invoice = allData?.data?.data?.[parseInt(key)];
      return invoice?.id;
    }).filter(Boolean);
    
    selectedIds.forEach((id) => {
      if (id) {
        setInvoiceAsPaidMutation.mutate(id, { 
          onSuccess: () => {
            refetch();
            setRowSelection({});
          }
        });
      }
    });
  }, [rowSelection, allData, setInvoiceAsPaidMutation, refetch]);

  const handleExport = useCallback(() => {
    if (!allData?.data?.data?.length) return;
    const ws = utils.json_to_sheet(allData.data.data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "External Invoices");
    writeFile(wb, "external_invoices.xlsx");
  }, [allData]);

  const metrics = statsData?.data?.metrics;
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="w-full space-y-6 p-y-8 animate-in fade-in-50">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">External Invoices</h1>
              <p className="text-muted-foreground">Manage and track all external invoices</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            {/* Quick Action Filters */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => handleQuickFilter('all')}
              >
                All Invoices
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleQuickFilter('pending')}
              >
                Pending
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleQuickFilter('paid')}
              >
                Paid
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleQuickFilter('overdue')}
              >
                Overdue
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleQuickFilter('today')}
              >
                Today
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => {}}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Controls Card */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Section */}
          <div className="flex-1 min-w-0 lg:max-w-xl">
            <SearchBar 
              currentSearchTerm={searchTerm} 
              onSearch={handleSearch}
              placeholder="Search invoices by ID, status, or amount..."
              className="w-full"
            />
          </div>

          {/* Metrics Section */}
          <div className="flex items-center gap-4 lg:border-l lg:border-border lg:pl-4">
            {/* Amount Stats */}
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
                onClick={selectedCount > 0 ? handleBulkPaid : undefined}
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
          </div>
        </div>
      </Card>

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
    </div>
  );
}
