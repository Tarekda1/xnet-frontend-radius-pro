import React from "react";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Props = {
  isLoading: boolean;
  error?: unknown;
  /** If true, renders empty fallback instead of children */
  isEmpty?: boolean;
  /** Optional retry handler (shown on error) */
  onRetry?: () => void;
  /** Custom loading UI */
  loading?: React.ReactNode;
  /** Custom empty UI */
  empty?: React.ReactNode;
  /** Custom error UI */
  errorFallback?: React.ReactNode;
  /** Used if errorFallback is not provided */
  errorTitle?: string;
  /** Used if empty is not provided */
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
};

function errorToMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Unknown error";
  try {
    // common axios-ish shapes: { message } or { response: { data: { message } } }
    const anyErr = error as any;
    return (
      anyErr?.response?.data?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      JSON.stringify(error)
    );
  } catch {
    return "Unknown error";
  }
}

export default function QueryState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loading,
  empty,
  errorFallback,
  errorTitle = "Something went wrong",
  emptyTitle = "No results",
  emptyDescription = "Try adjusting filters or search terms.",
  children,
}: Props) {
  if (isLoading) {
    return <>{loading ?? <div className="py-10 text-center text-muted-foreground">Loading…</div>}</>;
  }

  if (error) {
    if (errorFallback) return <>{errorFallback}</>;
    return (
      <div className="space-y-3">
        <Alert type="error" message={`${errorTitle}: ${errorToMessage(error)}`} />
        {onRetry ? (
          <div>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <>
        {empty ?? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={onRetry ? "Refresh" : undefined}
            onAction={onRetry}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}

