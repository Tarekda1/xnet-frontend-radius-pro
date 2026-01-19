import React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full py-6 space-y-6">
      <PageHeader title="Page not found" subtitle="The page you’re looking for doesn’t exist." icon={SearchX} />
      <EmptyState
        title="404 — Not Found"
        description="Check the URL or go back to the dashboard."
        icon={SearchX}
        actionLabel="Go to dashboard"
        onAction={() => navigate("/dashboard")}
      />
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => navigate("/")}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>
    </div>
  );
}

