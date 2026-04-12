import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { CalendarIcon, SearchIcon, X, Check, Download } from "lucide-react";
import { DateRange } from "react-day-picker";

type Props = {
  /* state */
  globalFilter?: string;
  dateRange?: DateRange | undefined;
  loading?: boolean;

  /* callbacks */
  onGlobalFilterChange?: (value: string) => void;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onSearch: (value: string) => void;
  onClearSearch: () => void;
  onClearDates?: () => void;
  
  /* bulk actions */
  onBulkPaid?: () => void;
  onExport?: () => void;
  selectedCount?: number;
  hasData?: boolean;
  
  currentSearchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  searchTerm: string;
};

const ExternalInvoicesSearchBar: React.FC<Props> = ({
  globalFilter,
  dateRange,
  loading,
  onDateRangeChange,
  onSearch,
  onClearSearch,
  onClearDates,
  onBulkPaid,
  onExport,
  selectedCount = 0,
  hasData = false,
}) => {
  const [search, setSearch] = useState<string>(globalFilter || "");
  
  const onClearSearchCb = () => {
    setSearch("");
    onClearSearch();
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch(search.trim());
  };

  return (
    <div className="space-y-2">
      {/* Bulk Action Buttons Header */}
      <div className="flex justify-end gap-1.5">
        {onBulkPaid && (
          <Button
            onClick={onBulkPaid}
            disabled={selectedCount === 0}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Set Selected as Paid ({selectedCount})
          </Button>
        )}
        
        {onExport && (
          <Button
            onClick={onExport}
            disabled={!hasData}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export to Excel
          </Button>
        )}
      </div>

      {/* Search Input and Date Range on Same Line */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices, clients, amounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            {search && (
              <button
                type="button"
                onClick={onClearSearchCb}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Button */}
        <Button 
          type="submit" 
          variant="default" 
          size="sm" 
          className="h-9 px-3"
        >
          <SearchIcon className="mr-1.5 h-3.5 w-3.5" />
          Search
        </Button>

        {/* Date Range Picker */}
        {onDateRangeChange && (
          <div className="flex gap-1.5 shrink-0">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              className="w-full sm:w-auto h-9"
            />
            
            {onClearDates && (
              <Button
                type="button"
                variant="outline"
                onClick={onClearDates}
                size="sm"
                className="h-9 px-3"
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default ExternalInvoicesSearchBar;
