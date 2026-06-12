import type React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** Optional slot under the value/sublabel (e.g. sparkline). */
  footer?: React.ReactNode;
};

export default function StatCard({ label, value, sublabel, icon, onClick, className, footer }: StatCardProps) {
  return (
    <Card
      className={cn(
        "border bg-card/60",
        onClick && "cursor-pointer transition-colors hover:bg-muted/40",
        className
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="truncate text-2xl font-semibold tracking-tight">{value}</div>
            {sublabel ? <div className="text-xs text-muted-foreground">{sublabel}</div> : null}
          </div>
          {icon ? <div className="shrink-0 text-muted-foreground">{icon}</div> : null}
        </div>
        {footer ? <div className="mt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
