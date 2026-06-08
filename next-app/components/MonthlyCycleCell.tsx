"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { monthlyCycleSummaryFromFields, type MonthlyCycleFields } from "@/lib/quotaCycle";

export type MonthlyCycleCellProps = MonthlyCycleFields & {
  className?: string;
};

export default function MonthlyCycleCell(props: MonthlyCycleCellProps) {
  const { className, ...fields } = props;
  const cycle = monthlyCycleSummaryFromFields(fields);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("space-y-1 min-w-[140px]", className)}>
            <div className="font-mono text-sm">{cycle.usageLabel}</div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  cycle.exceeded ? "bg-red-500" : cycle.pct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, cycle.pct)}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs transition-colors duration-200",
                  cycle.exceeded
                    ? "border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/35"
                    : "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/35"
                )}
              >
                {cycle.exceeded ? "Exceeded" : `${cycle.pct}%`}
              </Badge>
              <span className="text-xs text-muted-foreground">Resets {cycle.resetLabel}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cycle start: {fields.monthlyCycleStart ?? "—"}</p>
          {fields.quotaResetDay != null ? <p>Reset day: {fields.quotaResetDay}</p> : null}
          {fields.quotaCycleStartDate ? <p>Manual cycle start: {fields.quotaCycleStartDate}</p> : null}
          {fields.isMonthlyExceeded ? <p className="text-red-500">Flagged monthly exceeded (RADIUS)</p> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
