import { Skeleton } from "@/components/ui/skeleton";

/** Route-level loading UI for authenticated main segment (sits inside dashboard main). */
export default function MainRouteLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[200px] space-y-2">
          <Skeleton className="h-8 w-44 sm:w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg sm:col-span-2 lg:col-span-1" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
