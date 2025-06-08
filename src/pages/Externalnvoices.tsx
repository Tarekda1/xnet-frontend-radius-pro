import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExternalInvoicesSearchBar from "@/components/ExternalInvoicesSearchBar";
import ExternalInvoicesTable from "@/components/ExternalInvoicesTable";
import { Plus, FileText, TrendingUp, Clock, DollarSign, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import { DateRange } from "react-day-picker";
import { utils, writeFile } from "xlsx";
import { RowSelectionState, SortingState } from "@tanstack/react-table";

export default function ExternalInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
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

  // Pagination handlers
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleLastPage = useCallback(() => {
    if (allData?.data?.totalPages) {
      setCurrentPage(allData.data.totalPages);
    }
  }, [allData?.data?.totalPages]);

  // Bulk actions
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
  }, [rowSelection, allData, setInvoiceAsPaidMutation, refetch, setRowSelection]);

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
    <div className="w-full py-4 space-y-6">
      {/* Enhanced Header with Breadcrumbs */}
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">External Invoices</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track all external invoices
              </p>
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Metrics & Search Controls */}
      {metrics && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Dashboard Controls</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Metrics Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Invoice Metrics</h3>
                    <p className="text-xs text-muted-foreground">Statistics overview</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                    className="h-7 w-7 p-0"
                  >
                    {isMetricsExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                
                {isMetricsExpanded && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                    <Card className="p-3">
                      <div className="flex items-center justify-between space-y-0">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
                          <p className="text-lg font-bold">${metrics.totalAmount?.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center justify-between space-y-0">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Paid</p>
                          <p className="text-lg font-bold text-green-600">{metrics.totalPaid}</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center justify-between space-y-0">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Pending</p>
                          <p className="text-lg font-bold text-orange-600">{metrics.totalPending}</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center justify-between space-y-0">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Unpaid</p>
                          <p className="text-lg font-bold text-yellow-600">{metrics.totalUnpaid}</p>
                        </div>
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center justify-between space-y-0">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-blue-600">{metrics.totalInvoices}</p>
                        </div>
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                    </Card>
                  </div>
                )}
                
                {!isMetricsExpanded && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground py-2">
                    <span className="text-green-600">{metrics.totalPaid} paid</span>
                    <span className="text-yellow-600">{metrics.totalUnpaid} unpaid</span>
                    <span className="text-orange-600">{metrics.totalPending} pending</span>
                    <span className="text-blue-600">{metrics.totalInvoices} total</span>
                  </div>
                )}
              </div>

              {/* Right Column - Search & Actions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Search & Actions</h3>
                    <p className="text-xs text-muted-foreground">
                      Find and manage invoices
                      {selectedCount > 0 && (
                        <span className="ml-1 text-primary font-medium">
                          ({selectedCount} selected)
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                    className="h-7 w-7 p-0"
                  >
                    {isSearchExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                
                {isSearchExpanded && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <ExternalInvoicesSearchBar
                      currentSearchTerm={searchTerm}
                      onSearch={handleSearch}
                      setSearchTerm={setSearchTerm}
                      searchTerm={searchTerm}
                      onClearSearch={() => setSearchTerm("")}
                      dateRange={dateRange}
                      onDateRangeChange={handleDateRangeChange}
                      onClearDates={() => setDateRange(undefined)}
                      onBulkPaid={handleBulkPaid}
                      onExport={handleExport}
                      selectedCount={selectedCount}
                      hasData={!!allData?.data?.data?.length}
                    />
                  </div>
                )}
                
                {!isSearchExpanded && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground py-2">
                    <span>Search minimized</span>
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
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
        onPageSizeChange={handlePageSizeChange}
        onFirstPage={handleFirstPage}
        onLastPage={handleLastPage}
        totalItems={allData?.data?.total || 0}
      />
    </div>
  );
}
