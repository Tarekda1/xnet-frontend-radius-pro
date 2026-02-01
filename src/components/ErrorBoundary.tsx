import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { captureException } from "@/lib/telemetry";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }

  componentDidCatch(error: unknown) {
    // Keep minimal logging (use a real error tracker in production).
    if (import.meta.env.DEV) console.error("UI crashed:", error);
    captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                The page crashed. Try reloading.
              </div>
              {this.state.message ? (
                <pre className="text-xs bg-muted rounded-md p-3 overflow-auto">
                  {this.state.message}
                </pre>
              ) : null}
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()}>Reload</Button>
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false, message: undefined })}
                >
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

