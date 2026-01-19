import React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full py-6 space-y-6">
      <PageHeader title="Access denied" subtitle="You don’t have permission to view this page." icon={ShieldAlert} />
      <EmptyState
        title="403 — Forbidden"
        description="If you believe this is a mistake, ask an admin to update your role permissions."
        icon={ShieldAlert}
        actionLabel="Go back"
        onAction={() => navigate(-1)}
      />
    </div>
  );
}

