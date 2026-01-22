import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { apiClient } from "@/api/client";
import { notify } from "@/lib/notify";
import ActionConfirmDialog from "@/components/ActionConfirmDialog";
import UserSessionsPanel from "@/components/UserSessionsPanel";
import { useProfiles } from "@/hooks/useProfiles";

import type { User } from "@/types/api";
import { ArrowLeft, History, Settings, Trash2, Wifi, KeyRound } from "lucide-react";

async function fetchUserByUsername(username: string): Promise<User | null> {
  if (!username) return null;
  // Reuse existing search endpoint and select exact match if present.
  const resp = await apiClient.get("/radius/users/search", { params: { query: username } });
  const users: User[] = resp?.data?.data?.users ?? resp?.data?.data ?? [];
  const exact = users.find((u) => String(u.username).toLowerCase() === username.toLowerCase());
  return exact ?? users[0] ?? null;
}

export default function UserDetailPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { username: usernameParam } = useParams();
  const username = String(usernameParam ?? "").trim();

  const userQuery = useQuery({
    queryKey: ["userDetail", username],
    queryFn: () => fetchUserByUsername(username),
    enabled: Boolean(username),
  });

  const user = userQuery.data ?? null;

  const profilesQuery = useProfiles();
  const profiles = profilesQuery.data?.data ?? [];

  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [confirm, setConfirm] = useState<
    null | { kind: "reset-quota" | "reset-mac" | "disconnect" | "delete-user" }
  >(null);

  const resetQuotaMutation = useMutation({
    mutationFn: async () => apiClient.put(`/radius/users/resetQuota/${encodeURIComponent(username)}`),
    onSuccess: () => {
      notify.success("Success", "Daily quota reset.");
      qc.invalidateQueries({ queryKey: ["onlineUsers"] });
      qc.invalidateQueries({ queryKey: ["userDetail", username] });
    },
    onError: (e: any) => notify.error("Action failed", e?.message),
  });

  const resetMacMutation = useMutation({
    mutationFn: async () => apiClient.post(`/radius/users/resetAddress/${encodeURIComponent(username)}`),
    onSuccess: () => {
      notify.success("Success", "MAC address reset.");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["onlineUsers"] });
      qc.invalidateQueries({ queryKey: ["userDetail", username] });
    },
    onError: (e: any) => notify.error("Action failed", e?.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/radius/users/${encodeURIComponent(username)}`),
    onSuccess: () => {
      notify.success("Deleted", "User deleted.");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["onlineUsers"] });
      nav("/users/list");
    },
    onError: (e: any) => notify.error("Delete failed", e?.message),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: { profileId?: number; accountStatus?: string }) =>
      apiClient.put(`/radius/users/${encodeURIComponent(username)}`, { username, ...payload }),
    onSuccess: () => {
      notify.success("Saved", "User updated.");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["onlineUsers"] });
      qc.invalidateQueries({ queryKey: ["userDetail", username] });
    },
    onError: (e: any) => notify.error("Save failed", e?.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const runtimeEnv = (window as any).__ENV__ || {};
      const ip = String(runtimeEnv.DEFAULT_NAS_IP ?? import.meta.env.VITE_DEFAULT_NAS_IP ?? "").trim();
      const code = String(runtimeEnv.DEFAULT_NAS_SECRET ?? import.meta.env.VITE_DEFAULT_NAS_SECRET ?? "").trim();
      const port = Number(runtimeEnv.DEFAULT_NAS_COA_PORT ?? import.meta.env.VITE_DEFAULT_NAS_COA_PORT ?? 1700);
      if (!ip || !code) {
        throw new Error("NAS IP/secret not configured");
      }
      return apiClient.post(`/sessions/disconnect`, { username, ip, code, port });
    },
    onSuccess: () => {
      notify.success("Success", "Disconnect sent.");
      qc.invalidateQueries({ queryKey: ["onlineUsers"] });
    },
    onError: (e: any) =>
      notify.error("Disconnect failed", e?.message ?? "Set DEFAULT_NAS_* (prod) or VITE_DEFAULT_NAS_* (dev)."),
  });

  const derived = useMemo(() => {
    const fullName = user?.userDetails?.fullName ?? null;
    const profileName = user?.profile?.profileName ?? null;
    const mac = user?.macAddress?.macAddress ?? null;
    const status = user?.accountStatus ?? null;
    const online = Boolean(user?.isOnline);
    const last = user?.lastTimeActive ?? null;
    return { fullName, profileName, mac, status, online, last };
  }, [user]);

  // Default selections when user loads
  useMemo(() => {
    if (!user) return;
    if (!selectedProfileId && user.profileId != null) setSelectedProfileId(String(user.profileId));
    if (!selectedStatus && user.accountStatus) setSelectedStatus(String(user.accountStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="w-full py-6 space-y-6">
      <ActionConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={
          confirm?.kind === "delete-user"
            ? "Delete user?"
            : confirm?.kind === "disconnect"
              ? "Disconnect session?"
              : confirm?.kind === "reset-mac"
                ? "Reset MAC address?"
                : "Reset daily quota?"
        }
        description={
          confirm?.kind === "delete-user"
            ? `This will permanently delete ${username}.`
            : confirm?.kind === "disconnect"
              ? `This will send a CoA disconnect for ${username}.`
              : confirm?.kind === "reset-mac"
                ? `This will clear the stored MAC binding for ${username}.`
                : `This will reset daily quota counters for ${username}.`
        }
        confirmText={confirm?.kind === "delete-user" ? "Delete" : confirm?.kind === "disconnect" ? "Disconnect" : "Confirm"}
        confirmTone={confirm?.kind === "delete-user" || confirm?.kind === "disconnect" ? "destructive" : "default"}
        onConfirm={async () => {
          if (!confirm) return;
          if (confirm.kind === "reset-quota") return void (await resetQuotaMutation.mutateAsync());
          if (confirm.kind === "reset-mac") return void (await resetMacMutation.mutateAsync());
          if (confirm.kind === "disconnect") return void (await disconnectMutation.mutateAsync());
          if (confirm.kind === "delete-user") return void (await deleteUserMutation.mutateAsync());
        }}
      />

      <PageHeader
        title={username ? `User: ${username}` : "User"}
        subtitle={derived.fullName ? derived.fullName : "User details and session history"}
        icon={Settings}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => nav("/users/list")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <Button variant="outline" onClick={() => nav(`/users/${encodeURIComponent(username)}/sessions`)}>
              <History className="h-4 w-4 mr-2" />
              Full Sessions
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Badge variant="outline" className={derived.online ? "border-blue-500 text-blue-700" : "border-gray-300 text-gray-700"}>
            <Wifi className="h-3.5 w-3.5 mr-1.5" />
            {derived.online ? "Online" : "Offline"}
          </Badge>
          {derived.status ? <Badge variant="secondary">{derived.status}</Badge> : null}
          {derived.profileName ? <Badge variant="outline">Profile: {derived.profileName}</Badge> : null}
          {derived.mac ? <Badge variant="outline">MAC: {derived.mac}</Badge> : null}
          {derived.last ? <span className="text-sm text-muted-foreground">Last active: {new Date(derived.last).toLocaleString()}</span> : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profile</Label>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.profileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="mt-2"
                  disabled={!selectedProfileId || profilesQuery.isLoading}
                  onClick={() => updateUserMutation.mutate({ profileId: Number(selectedProfileId) })}
                >
                  Save profile
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="mt-2" disabled={!selectedStatus} onClick={() => updateUserMutation.mutate({ accountStatus: selectedStatus })}>
                  Save status
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to={`/users/${encodeURIComponent(username)}/sessions`}>View session history</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <UserSessionsPanel username={username} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setConfirm({ kind: "reset-quota" })} disabled={!username}>
                <KeyRound className="h-4 w-4 mr-2" />
                Reset daily quota
              </Button>
              <Button variant="outline" onClick={() => setConfirm({ kind: "reset-mac" })} disabled={!username}>
                Reset MAC
              </Button>
              <Button variant="destructive" onClick={() => setConfirm({ kind: "disconnect" })} disabled={!username}>
                Disconnect (CoA)
              </Button>
              <Button variant="destructive" onClick={() => setConfirm({ kind: "delete-user" })} disabled={!username}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete user
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

