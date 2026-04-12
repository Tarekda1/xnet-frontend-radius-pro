import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-route Suspense fallback — reads as “loading the shell”, not a tiny spinner.
 */
export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8 space-y-6 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 md:w-64" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg md:col-span-2 lg:col-span-1" />
      </div>
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
