import React from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./button";

/** Sortable column header control (avoids React.FC typing issues across React 18/19). */
export function HeaderButton({
  column,
  children,
  className,
}: {
  column: unknown;
  children: React.ReactNode;
  className?: string;
}) {
  const col = column as { toggleSorting: (asc: boolean) => void; getIsSorted: () => string | false };
  return (
    <Button
      variant="ghost"
      onClick={() => col.toggleSorting(col.getIsSorted() === "asc")}
      className={`w-full justify-start hover:bg-muted/70 dark:hover:bg-muted/45 p-0! ${className ?? ""} `}
    >
      {children}
      <ArrowUpDown className="ml-1 h-4 w-4" />
    </Button>
  );
}
