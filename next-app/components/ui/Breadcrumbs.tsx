import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

function formatSegment(segment: string): string {
  const decoded = decodeURIComponent(segment);
  if (/^\d+$/.test(decoded)) return decoded;
  return decoded.replace(/-/g, " ");
}

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        <li className="flex items-center gap-1 min-w-0">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
              "text-primary hover:bg-accent/80 hover:text-accent-foreground transition-colors"
            )}
          >
            <Home className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>
        {pathnames.map((value: string, index: number) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const label = formatSegment(value);

          return (
            <li key={`${routeTo}-${index}`} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-border" aria-hidden />
              {isLast ? (
                <span
                  className="truncate font-medium text-foreground px-1.5 py-0.5 max-w-[min(100%,14rem)] sm:max-w-[20rem]"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={routeTo}
                  className={cn(
                    "truncate rounded-md px-1.5 py-0.5 max-w-[10rem] sm:max-w-xs",
                    "text-primary hover:bg-accent/80 hover:text-accent-foreground transition-colors"
                  )}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
