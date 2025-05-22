import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface Props {
  onSearch: (term: string) => void;
  currentSearchTerm: string;
}
const SearchBar: React.FC<Props> = React.memo(({ onSearch, currentSearchTerm }) => {
  const [value, setValue] = useState(currentSearchTerm);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleSearch = useCallback(() => {
    const trimmedValue = value.trim();
    onSearch(trimmedValue);
  }, [value, onSearch]);

  const clear = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <div className="relative flex-grow sm:flex-grow-0">
        <Input
          placeholder="Search users…"
          value={value}
          onChange={handleInputChange}
          className="pr-8"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        {value && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Button
        variant="outline"
        onClick={handleSearch}
        disabled={!value?.trim()}
      >
        <Search className="h-4 w-4 mr-1" /> Search
      </Button>
    </div>
  );
});

export default SearchBar;