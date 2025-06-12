import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  onSearch: (term: string) => void;
  currentSearchTerm: string;
  className?: string;
  placeholder?: string;
  showAdvancedSearch?: boolean;
  onAdvancedSearch?: () => void;
}

const SearchBar: React.FC<Props> = React.memo(({ 
  onSearch, 
  currentSearchTerm,
  className,
  placeholder = "Search users...",
  showAdvancedSearch = false,
  onAdvancedSearch
}) => {
  const [value, setValue] = useState(currentSearchTerm);
  const [isFocused, setIsFocused] = useState(false);

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

  const searchHints = [
    { label: "Find by username", example: "username:john" },
    { label: "Find by status", example: "status:active" },
    { label: "Find by profile", example: "profile:premium" },
    { label: "Find online users", example: "status:online" },
  ];

  return (
    <div className={cn(
      "flex gap-2 w-full transition-all duration-200",
      isFocused && "scale-[1.01]",
      className
    )}>
      <div className="relative flex-grow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-10 pr-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          {value && (
            <button
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search hints dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Search Tips</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {searchHints.map((hint, index) => (
                <DropdownMenuItem
                  key={index}
                  className="flex flex-col items-start"
                  onClick={() => setValue(hint.example)}
                >
                  <span className="text-sm font-medium">{hint.label}</span>
                  <span className="text-xs text-muted-foreground">{hint.example}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        variant="default"
        onClick={handleSearch}
        disabled={!value?.trim()}
        className="shrink-0"
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
});

export default SearchBar;