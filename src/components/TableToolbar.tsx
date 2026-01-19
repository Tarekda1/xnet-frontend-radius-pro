import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, Rows3 } from "lucide-react";

type Density = "comfortable" | "compact";

function readDensity(storageKey: string, defaultValue: Density): Density {
  try {
    const v = localStorage.getItem(storageKey);
    if (v === "compact" || v === "comfortable") return v;
  } catch {}
  return defaultValue;
}

function writeDensity(storageKey: string, value: Density) {
  try {
    localStorage.setItem(storageKey, value);
  } catch {}
}

function applyDensityToRoot(value: Density) {
  const root = document.documentElement;
  if (value === "compact") root.classList.add("table-compact");
  else root.classList.remove("table-compact");
}

type Props = {
  /** Left-side label, e.g. "25 users" */
  label: string;
  /** Persist density across the app; default "ui.tableDensity" */
  densityStorageKey?: string;
  /** Default density if nothing stored */
  defaultDensity?: Density;
  /** Optional extra actions (export, columns...) */
  right?: React.ReactNode;
  className?: string;
};

export default function TableToolbar({
  label,
  densityStorageKey = "ui.tableDensity",
  defaultDensity = "comfortable",
  right,
  className,
}: Props) {
  const [density, setDensity] = React.useState<Density>(() => readDensity(densityStorageKey, defaultDensity));

  React.useEffect(() => {
    applyDensityToRoot(density);
    writeDensity(densityStorageKey, density);
  }, [density, densityStorageKey]);

  return (
    <div className={cn("flex items-center justify-between px-3 py-2 border-b bg-white", className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        {right}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
          className="gap-2"
        >
          {density === "compact" ? <Rows3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          {density === "compact" ? "Compact" : "Comfortable"}
        </Button>
      </div>
    </div>
  );
}

