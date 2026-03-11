import React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconActionButtonProps = {
  label: string;
  icon: React.ReactNode;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
  /** Default: "md" (h-8 w-8) */
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function IconActionButton({
  label,
  icon,
  to,
  onClick,
  disabled,
  variant = "outline",
  size = "md",
  className,
}: IconActionButtonProps) {
  const sizeClass = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-9 w-9" : "h-8 w-8";
  const button = to ? (
    <Button
      asChild
      size="icon"
      variant={variant}
      disabled={disabled}
      aria-label={label}
      className={cn(sizeClass, className)}
    >
      <Link to={to}>{icon}</Link>
    </Button>
  ) : (
    <Button
      size="icon"
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(sizeClass, className)}
      type="button"
    >
      {icon}
    </Button>
  );

  // Radix Tooltip won't trigger on a disabled button, so wrap it.
  const trigger = disabled ? <span className="inline-flex">{button}</span> : button;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

