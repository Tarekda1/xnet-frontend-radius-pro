import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { CalendarIcon, RefreshCw, SearchIcon, X } from "lucide-react";
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
  onRefresh?: () => void;
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
  onRefresh,
}) => {
  const [search, setSearch] = useState<string>(globalFilter || "");
  const onClearSearchCb = () => {
    setSearch("");
    onClearSearch();
  };
  return <form
    onSubmit={(e) => {
      e.preventDefault();
      onSearch(search.trim());
    }}
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4"
  >
    {/* ── Search text ─────────────────────────────── */}
    <div className="relative w-full sm:w-64">
      <Input
        placeholder="Search invoices…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pr-10"
      />
      {search && (
        <button
          type="button"
          onClick={onClearSearchCb}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>

    <Button type="submit" variant="outline" className="w-full sm:w-auto">
      <SearchIcon className="mr-2 h-4 w-4" />
      Search
    </Button>

    {/* ── Date range ──────────────────────────────── */}
    {/* <DateRangePicker
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      className="w-full sm:w-auto"
    />
    <Button
      variant="outline"
      onClick={onClearDates}
      className="w-full sm:w-auto"
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      Clear Dates
    </Button> */}

    {/* ── Refresh ─────────────────────────────────── */}
    {/* <Button
      variant="outline"
      onClick={onRefresh}
      className="w-full sm:w-auto"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      {loading ? "Loading" : "Refresh"}
    </Button> */}
  </form>
};

export default ExternalInvoicesSearchBar;
