import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  default: "border-gray-200 bg-gray-50 text-gray-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
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
            tone === "default" && "bg-gray-400",
            pulseDot && "animate-pulse"
          )}
        />
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
    </Badge>
  );
}

