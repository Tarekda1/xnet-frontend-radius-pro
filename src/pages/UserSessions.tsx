import UserSessionsPanel from "@/components/UserSessionsPanel";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import IconActionButton from "@/components/IconActionButton";
import { ArrowLeft, History } from "lucide-react";

export default function UserSessionsPage() {
  const nav = useNavigate();
  const { username: usernameParam } = useParams();
  const username = String(usernameParam ?? "").trim();

  return (
    <div className="w-full py-6 space-y-6">
      <PageHeader
        title="User Sessions"
        subtitle={username ? `Session history for ${username}` : "Session history"}
        icon={History}
        actions={
          <div className="flex gap-2">
            <IconActionButton label="Back" onClick={() => nav(-1)} icon={<ArrowLeft className="h-4 w-4" />} />
          </div>
        }
      />

      <UserSessionsPanel username={username} />
    </div>
  );
}

