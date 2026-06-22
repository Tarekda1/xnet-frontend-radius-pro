import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import TopBarActions from "@/components/ui/TopBarActions";

function formatSegment(segment: string): string {
  const decoded = decodeURIComponent(segment);
  if (/^\d+$/.test(decoded)) return decoded;
  return decoded.replace(/-/g, " ");
}

/** Map section crumbs to real list/index routes (pathname segments alone are often invalid). */
const BREADCRUMB_SECTION_ROOTS: Record<string, string> = {
  users: "/users/list",
  profiles: "/profiles/list",
};

const USERS_STATIC_SEGMENTS = new Set(["list", "new"]);

function resolveBreadcrumbHref(pathnames: string[], index: number): string {
  const segment = pathnames[index];
  const usersIndex = pathnames.indexOf("users");

  const sectionRoot = BREADCRUMB_SECTION_ROOTS[segment];
  if (sectionRoot) return sectionRoot;

  if (usersIndex >= 0 && index === usersIndex + 1 && !USERS_STATIC_SEGMENTS.has(segment)) {
    return `/users/${encodeURIComponent(segment)}`;
  }

  return `/${pathnames.slice(0, index + 1).join("/")}`;
}

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter(Boolean);

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1 text-sm">
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
          const routeTo = resolveBreadcrumbHref(pathnames, index);
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
      <TopBarActions />
    </div>
  );
};

export default Breadcrumb;
