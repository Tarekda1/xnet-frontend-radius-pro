import UserSessionsPanel from "@/components/UserSessionsPanel";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import IconActionButton from "@/components/IconActionButton";
import { ArrowLeft, History } from "lucide-react";

export default function UserSessionsPage() {
  const router = useRouter();
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
            <IconActionButton label="Back" onClick={() => router.back()} icon={<ArrowLeft className="h-4 w-4" />} />
          </div>
        }
      />

      <UserSessionsPanel username={username} />
    </div>
  );
}

