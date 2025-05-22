// OnlineUsersPage.tsx (or wherever you host the page)
import React, { useState, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import OnlineUsersTable from "../components/OnlineUsersTable";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnlineUsersPage() {
  const [search, setSearch] = useState("");

  const handleSearch = useCallback((term: string) => {
    setSearch(term);
  }, []);

  return (
    <div className="w-full py-4 space-y-6">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Online Users</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <SearchBar currentSearchTerm={search} onSearch={handleSearch} />
          <Button variant="outline" onClick={() => setSearch((s) => s)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </header>

      <OnlineUsersTable search={search} />
    </div>
  );
}
