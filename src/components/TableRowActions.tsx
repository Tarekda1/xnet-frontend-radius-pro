import React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TableRowAction = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  tone?: "default" | "destructive";
};

type Props = {
  actions: TableRowAction[];
  label?: string;
  align?: "start" | "end" | "center";
  triggerSrLabel?: string;
  contentClassName?: string;
  triggerClassName?: string;
};

export default function TableRowActions({
  actions,
  label = "Actions",
  align = "end",
  triggerSrLabel = "Open menu",
  contentClassName,
  triggerClassName,
}: Props) {
  const visible = actions.filter((a) => Boolean(a));
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("h-8 w-8 p-0 hover:bg-accent/50", triggerClassName)}>
          <span className="sr-only">{triggerSrLabel}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("w-[180px]", contentClassName)}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {visible.map((action) => {
          const Icon = action.icon;
          const isDestructive = action.tone === "destructive";
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              title={action.disabled ? (action.disabledReason || action.label) : action.label}
              onClick={(e) => {
                // Avoid selecting text / focus weirdness; consistent with other menus in app.
                e.preventDefault();
                action.onClick?.();
              }}
              className={cn(
                "cursor-pointer",
                !isDestructive && "hover:bg-accent/50",
                isDestructive && "text-red-600 hover:bg-red-50 hover:text-red-700"
              )}
            >
              {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

