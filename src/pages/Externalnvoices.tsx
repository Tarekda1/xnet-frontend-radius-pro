import React, { useState, useCallback } from "react";
import ExternalInvoicesSearchBar from "@/components/ExternalInvoicesSearchBar";
import ExternalInvoicesTable     from "@/components/ExternalInvoicesTable";

export default function ExternalInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return (
    <div className="w-full py-4 space-y-6">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">External Invoices</h1>

        <div className="flex gap-2 w-full md:w-auto">
          <ExternalInvoicesSearchBar
            currentSearchTerm={searchTerm}
            onSearch={handleSearch}
            setSearchTerm={setSearchTerm}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm("")}
          />
          {/* quick client‑side refresh (keeps same search term) */}
          {/* <Button variant="outline" onClick={() => setSearchTerm((s) => s)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button> */}
        </div>
      </header>

      {/* data / table lives here */}
      <ExternalInvoicesTable search={searchTerm} />
    </div>
  );
}
