import React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  /** Default: "card" */
  variant?: "card" | "gradient";
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  rightContent,
  className,
  variant = "card",
}) => {
  const isGradient = variant === "gradient";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        isGradient
          ? "relative overflow-hidden border-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-xl"
          : "bg-background",
        className
      )}
    >
      {isGradient ? (
        <>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
        </>
      ) : null}

      <div className={cn("relative", isGradient && "z-10")}>
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            {Icon ? (
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border",
                  isGradient ? "border-white/25 bg-white/15" : "border-border bg-muted"
                )}
              >
                <Icon className={cn("h-5 w-5", isGradient ? "text-white" : "text-foreground")} />
              </div>
            ) : null}

            <div className="min-w-0">
              <h1 className={cn("text-xl sm:text-2xl font-semibold leading-tight", isGradient && "text-white")}>{title}</h1>
              {subtitle ? (
                <p className={cn("mt-1 text-sm", isGradient ? "text-white/80" : "text-muted-foreground")}>{subtitle}</p>
              ) : null}
            </div>
          </div>

          {(rightContent || actions) ? (
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
              {rightContent ? <div className="w-full md:w-auto">{rightContent}</div> : null}
              {actions ? (
                <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;


