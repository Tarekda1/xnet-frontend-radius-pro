import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  default:
    "border-border bg-muted/50 text-foreground dark:bg-muted/30",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300",
  info:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300",
};

export default function StatusPill(props: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  pulseDot?: boolean;
  className?: string;
}) {
  const { label, tone = "default", dot = false, pulseDot = false, className } = props;

  return (
    <Badge
      variant="outline"
      className={cn("relative gap-2 px-2.5 py-1 border", toneClasses[tone], className)}
    >
      {dot ? (
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            tone === "success" && "bg-emerald-500",
            tone === "warning" && "bg-amber-500",
            tone === "danger" && "bg-red-500",
            tone === "info" && "bg-blue-500",
            tone === "default" && "bg-muted-foreground/60",
            pulseDot && "animate-pulse"
          )}
        />
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
    </Badge>
  );
}

