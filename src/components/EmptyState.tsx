import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="py-10">
        <div className="mx-auto max-w-md text-center space-y-3">
          {Icon ? (
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
          ) : null}
          <div className="text-lg font-semibold">{title}</div>
          {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
          {actionLabel && onAction ? (
            <div className="pt-2">
              <Button variant="outline" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

