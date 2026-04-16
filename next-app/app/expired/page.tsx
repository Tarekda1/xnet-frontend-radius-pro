"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ExpiredContent() {
  const searchParams = useSearchParams();
  const account = searchParams.get("u")?.trim() || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-destructive/30 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
          </div>
          <CardTitle className="text-xl">Account access has expired</CardTitle>
          <CardDescription>
            Your subscription has ended. New logins are blocked until your provider renews your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          {account ? (
            <p>
              Account: <span className="font-mono font-medium text-foreground">{account}</span>
            </p>
          ) : null}
          <p>
            Please contact your provider or administrator to renew your plan. After renewal, disconnect and
            sign in again.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Staff login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExpiredHotspotPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <ExpiredContent />
    </Suspense>
  );
}
