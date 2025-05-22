import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number
  showPercentage?: boolean
  text?: string
}

function Progress({
  className,
  value,
  showPercentage = false,
  text,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative  w-[150px] overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-orange-500 h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      >
        {(showPercentage || text) && (
          <div className="absolute left-[220px] inset-0 flex items-center justify-center">
            <span className="text-[8px] text-back font-semibold whitespace-nowrap">
              {text || `${Math.round(value || 0)}%`}
            </span>
          </div>
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
