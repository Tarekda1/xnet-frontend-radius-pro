import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Home, ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location?.pathname || "";

  return (
    <div className="w-full py-6 space-y-6">
      <PageHeader
        title="Access denied"
        subtitle={path ? `You don’t have permission to view: ${path}` : "You don’t have permission to view this page."}
        icon={ShieldAlert}
      />
      <EmptyState
        title="403 — Forbidden"
        description="If you believe this is a mistake, ask an admin to update your role permissions."
        icon={ShieldAlert}
        actionLabel="Go to Dashboard"
        onAction={() => navigate("/dashboard")}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ShieldAlert className="h-4 w-4" />
          Go back
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <Home className="h-4 w-4" />
          Home
        </button>
      </div>
    </div>
  );
}

