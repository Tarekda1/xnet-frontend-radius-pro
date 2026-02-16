// OnlineUsersPage.tsx (or wherever you host the page)
import { useMemo, useState, useCallback, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import OnlineUsersTable from "../components/OnlineUsersTable";
import { RefreshCw, Users, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { websocketService } from "@/services/websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/notify";
import { MESSAGES } from "@/constants/messages";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProfiles } from "@/hooks/useProfiles";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import SavedViews from "@/components/SavedViews";
import type { SavedViewState } from "@/lib/savedViews";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useSearchParams } from "react-router-dom";

type OnlineUsersMetrics = { totalOnlineUsers: number; totalActiveUsers: number };

function StatCard(props: { label: string; value: string | number; sublabel?: string; icon?: React.ReactNode }) {
  return (
    <Card className="border bg-card/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{props.label}</div>
            <div className="text-2xl font-semibold tracking-tight truncate">{props.value}</div>
            {props.sublabel ? <div className="text-xs text-muted-foreground">{props.sublabel}</div> : null}
          </div>
          {props.icon ? <div className="text-muted-foreground">{props.icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OnlineUsersPage() {
  const [searchParams] = useSearchParams();
  const initialSearchFromUrl = useMemo(() => String(searchParams.get("search") ?? "").trim(), [searchParams]);
  const [search, setSearch] = useState(initialSearchFromUrl);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());

  // Change profile modal
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [currentProfileName, setCurrentProfileName] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [disconnectAfterProfileChange, setDisconnectAfterProfileChange] = useState(true);
  const profilesQuery = useProfiles();

  const metricsQuery = useQuery({
    queryKey: ["online-users-metrics"],
    queryFn: async (): Promise<OnlineUsersMetrics> => {
      const resp = await apiClient.get("/online-users-metrics");
      return (resp.data?.data ?? { totalOnlineUsers: 0, totalActiveUsers: 0 }) as OnlineUsersMetrics;
    },
    // Keep it fresh but not chatty; table itself refreshes on demand.
    refetchInterval: 15000,
    staleTime: 10_000,
  });

  // Live traffic modal
  const [trafficUsername, setTrafficUsername] = useState<string | null>(null);
  const [trafficSamples, setTrafficSamples] = useState<
    {
      t: number;
      lastUpdateMs: number;
      totalInBytes: number;
      totalOutBytes: number;
      downKBs: number;
      upKBs: number;
    }[]
  >([]);

  const trafficQuery = useOnlineUsers(trafficUsername ?? "", 1, 25, {
    enabled: Boolean(trafficUsername),
    refetchInterval: trafficUsername ? 2000 : undefined,
  });

  const handleSearch = useCallback((term: string) => {
    setSearch(term);
  }, []);

  useEffect(() => {
    setSearch(initialSearchFromUrl);
  }, [initialSearchFromUrl]);

  const sessionsSavedViewsKeys = useMemo(() => ["search"], []);
  const getSessionsViewState = useCallback((): SavedViewState => ({ search: String(search ?? "") }), [search]);
  const applySessionsViewState = useCallback((state: SavedViewState) => {
    setSearch(String(state.search ?? ""));
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Trigger table refetch + clear loading indicator after a short delay
    setRefreshToken((n) => n + 1);
    setLastRefreshedAt(new Date());
    metricsQuery.refetch().catch(() => null);
    setTimeout(() => {
      setIsRefreshing(false);
      notify.success(MESSAGES.onlineUsers.refreshedTitle, MESSAGES.onlineUsers.refreshedDescription);
    }, 500);
  }, [metricsQuery]);

  const openChangeProfile = useCallback((username: string, profileName?: string) => {
    setProfileUsername(username);
    setCurrentProfileName(String(profileName ?? ""));
    setSelectedProfileId("");
    setDisconnectAfterProfileChange(true);
  }, []);

  const closeChangeProfile = useCallback(() => {
    setProfileUsername(null);
    setCurrentProfileName("");
    setSelectedProfileId("");
    setDisconnectAfterProfileChange(true);
  }, []);

  // Auto-select the current profile when opening the dialog (match by profileName).
  useEffect(() => {
    if (!profileUsername) return;
    if (selectedProfileId) return; // don't override user selection
    const want = currentProfileName.trim().toLowerCase();
    if (!want) return;
    const profiles = profilesQuery.data?.data ?? [];
    const match = profiles.find((p) => p.profileName?.trim().toLowerCase() === want);
    if (match?.id != null) setSelectedProfileId(String(match.id));
  }, [profileUsername, currentProfileName, selectedProfileId, profilesQuery.data]);

  const openTraffic = useCallback((username: string) => {
    setTrafficUsername(username);
    setTrafficSamples([]);
  }, []);

  const closeTraffic = useCallback(() => {
    setTrafficUsername(null);
    setTrafficSamples([]);
  }, []);

  // Use the same backend action endpoints as the table actions (no auto-fetch).
  const actions = useOnlineUsers("", 1, 1, { enabled: false });
  const changeProfileMutation = actions.changeUserProfileMutation;
  const disconnectUserSessionMutation = actions.disconnectUserSessionMutation;

  const canSubmitProfileChange = Boolean(profileUsername) && Boolean(selectedProfileId) && selectedProfileId !== "-1";

  const submitProfileChange = useCallback(async () => {
    if (!profileUsername) return;
    const pid = Number(selectedProfileId);
    if (!Number.isFinite(pid) || pid <= 0) return;

    try {
      await changeProfileMutation.mutateAsync({ username: profileUsername, profileId: pid });

      if (disconnectAfterProfileChange) {
        try {
          await disconnectUserSessionMutation.mutateAsync({ username: profileUsername });
        } catch (e: any) {
          // Profile change succeeded, disconnect failed: show a clear message.
          notify.error("Profile updated", "Disconnect failed. User may need manual disconnect.");
        }
      }

      closeChangeProfile();
      setRefreshToken((n) => n + 1);
    } catch (e: any) {
      // Errors are already surfaced by the mutation's onError toast, but keep this safe.
      notify.error("Action failed", e?.message || "Failed to change profile");
    }
  }, [
    profileUsername,
    selectedProfileId,
    disconnectAfterProfileChange,
    changeProfileMutation,
    disconnectUserSessionMutation,
    closeChangeProfile,
  ]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Subscribe to WebSocket notifications
    const unsubscribe = websocketService.onNotification((data) => {
      if (data.type === 'USER_STATUS_CHANGE') {
        notify.success(MESSAGES.onlineUsers.statusUpdatedTitle, `${data.username} is now ${data.status}`);
        handleRefresh();
      }
    });

    // Initial connection
    websocketService.connect();

    return () => {
      clearTimeout(timer);
      unsubscribe();
      websocketService.disconnect();
    };
  }, [handleRefresh]);

  // Build traffic samples from polled counters (sum across all sessions for that username)
  useEffect(() => {
    if (!trafficUsername) return;
    const rows = trafficQuery.data?.data ?? [];
    if (!rows.length) return;

    // Derive a stable "sample timestamp" from server-side session_last_update.
    // If accounting updates arrive every N seconds, this avoids showing 0 between UI polls.
    const lastUpdateMs = rows.reduce((max, r) => {
      const t = Date.parse((r.session_last_update as any) ?? "") || 0;
      return Math.max(max, t);
    }, 0);

    const totals = rows.reduce(
      (acc, r) => {
        const inBytes = parseInt((r.total_bytes_in ?? "0") as any, 10) || 0;
        const outBytes = parseInt((r.total_bytes_out ?? "0") as any, 10) || 0;
        return { inBytes: acc.inBytes + inBytes, outBytes: acc.outBytes + outBytes };
      },
      { inBytes: 0, outBytes: 0 }
    );

    const now = Date.now();
    setTrafficSamples((prev) => {
      const last = prev[prev.length - 1];
      if (!last) {
        return [
          {
            t: now,
            lastUpdateMs,
            totalInBytes: totals.inBytes,
            totalOutBytes: totals.outBytes,
            downKBs: 0,
            upKBs: 0,
          },
        ];
      }

      // Only compute a new rate when the server-side last_update advances (i.e., new accounting data arrived).
      const effectiveLastUpdateMs = lastUpdateMs || now;
      const prevLastUpdateMs = last.lastUpdateMs || last.t;
      const dt = Math.max((effectiveLastUpdateMs - prevLastUpdateMs) / 1000, 1);

      // If we haven't received a new accounting update yet, keep the last sample to avoid flat zeroes.
      if (effectiveLastUpdateMs === prevLastUpdateMs) {
        return prev;
      }

      const downRate = Math.max((totals.inBytes - last.totalInBytes) / dt, 0);
      const upRate = Math.max((totals.outBytes - last.totalOutBytes) / dt, 0);

      const next = {
        t: now,
        lastUpdateMs: effectiveLastUpdateMs,
        totalInBytes: totals.inBytes,
        totalOutBytes: totals.outBytes,
        downKBs: downRate / 1024,
        upKBs: upRate / 1024,
      };

      return [...prev.slice(-29), next];
    });
  }, [trafficQuery.data, trafficUsername]);

  const trafficChartData = useMemo(() => {
    return trafficSamples
      .filter((s) => s.downKBs !== undefined)
      .map((s) => ({
        time: new Date(s.t).toLocaleTimeString(),
        downKbps: Number((s.downKBs || 0).toFixed(1)),
        upKbps: Number((s.upKBs || 0).toFixed(1)),
      }));
  }, [trafficSamples]);

  if (isLoading) {
    return (
      <div className="w-full py-6 space-y-6">
        <PageHeader
          title="Live Sessions"
          subtitle="Monitor and manage active RADIUS sessions"
          icon={Users}
          rightContent={<Skeleton className="h-10 w-full md:w-[300px]" />}
          actions={
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-0">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 mt-2" />
              <Skeleton className="h-3 w-28 mt-2" />
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 mt-2" />
              <Skeleton className="h-3 w-28 mt-2" />
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32 mt-2" />
              <Skeleton className="h-3 w-28 mt-2" />
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-none">
          <CardContent className="px-0">
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalOnline = Number(metricsQuery.data?.totalOnlineUsers ?? onlineCount) || 0;
  const activeOnline = Number(metricsQuery.data?.totalActiveUsers ?? onlineCount) || 0;
  const idleOnline = Math.max(totalOnline - activeOnline, 0);

  return (
    <div className="w-full py-6 space-y-6">
      <PageHeader
        title="Live Sessions"
        subtitle="Monitor and manage active RADIUS sessions"
        icon={Users}
        actions={(
          <div className="flex gap-2 items-center">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        )}
      />

      {/* Summary + controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <StatCard
            label="Active"
            value={activeOnline}
            sublabel="Currently active sessions"
            icon={<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Activity className="h-5 w-5" /></div>}
          />
        </div>
        <div className="lg:col-span-4">
          <StatCard
            label="Total online"
            value={totalOnline}
            sublabel={idleOnline ? `${idleOnline} idle / stale` : "No idle sessions"}
            icon={<div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>}
          />
        </div>
        <div className="lg:col-span-4">
          <StatCard
            label="Last refresh"
            value={lastRefreshedAt.toLocaleTimeString()}
            sublabel={metricsQuery.isFetching ? "Updating metrics…" : " "}
            icon={<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><Clock className="h-5 w-5 text-muted-foreground" /></div>}
          />
        </div>

        <Card className="lg:col-span-12">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
              <div className="flex-1 min-w-0 lg:max-w-xl">
                <SearchBar 
                  currentSearchTerm={search} 
                  onSearch={handleSearch}
                  placeholder="Search by username or full name…"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <SavedViews
                  storageKey="savedViews:liveSessions"
                  keys={sessionsSavedViewsKeys}
                  getState={getSessionsViewState}
                  applyState={applySessionsViewState}
                  compact
                  onSaved={() => notify.success("View saved")}
                  onDeleted={() => notify.success("View deleted")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <OnlineUsersTable 
        search={search} 
        onCountChange={setOnlineCount}
        isRefreshing={isRefreshing}
        refreshToken={refreshToken}
        onChangeProfile={openChangeProfile}
        onViewTraffic={openTraffic}
      />

      {/* Change Profile Dialog */}
      <Dialog open={Boolean(profileUsername)} onOpenChange={(open) => (open ? null : closeChangeProfile())}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Change Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              User: <span className="font-medium text-foreground">{profileUsername ?? "—"}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Current profile: <span className="font-medium text-foreground">{currentProfileName || "—"}</span>
            </div>
            <div className="space-y-2">
              <Label>New profile</Label>
              <Select value={selectedProfileId || undefined} onValueChange={setSelectedProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder={profilesQuery.isLoading ? "Loading..." : "Select profile"} />
                </SelectTrigger>
                <SelectContent>
                  {profilesQuery.isLoading ? (
                    <SelectItem value="-1">Loading profiles...</SelectItem>
                  ) : profilesQuery.error ? (
                    <SelectItem value="-1">Error loading profiles</SelectItem>
                  ) : (
                    profilesQuery.data?.data?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.profileName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Disconnect after change</div>
                <div className="text-xs text-muted-foreground">
                  Recommended so the user re-auths and the new profile applies immediately.
                </div>
              </div>
              <Switch
                checked={disconnectAfterProfileChange}
                onCheckedChange={setDisconnectAfterProfileChange}
                disabled={changeProfileMutation.isPending || disconnectUserSessionMutation.isPending}
              />
            </div>

            {(() => {
              const pid = Number(selectedProfileId);
              if (!Number.isFinite(pid) || pid <= 0) return null;
              const p = (profilesQuery.data?.data ?? []).find((x) => x.id === pid);
              if (!p) return null;
              return (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <div className="text-sm font-medium">{p.profileName}</div>
                  <div className="text-xs text-muted-foreground">
                    Daily: {p.dailyQuota} · Monthly: {p.monthlyQuota}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Down: {p.speedDown ?? "—"} · Up: {p.speedUp ?? "—"} · Max: {p.maxSessions ?? "—"}
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeChangeProfile}>
              Cancel
            </Button>
            <Button
              onClick={submitProfileChange}
              disabled={
                !canSubmitProfileChange ||
                changeProfileMutation.isPending ||
                disconnectUserSessionMutation.isPending
              }
            >
              {changeProfileMutation.isPending
                ? "Saving..."
                : disconnectUserSessionMutation.isPending
                  ? "Disconnecting..."
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Traffic Dialog */}
      <Dialog open={Boolean(trafficUsername)} onOpenChange={(open) => (open ? null : closeTraffic())}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Live Traffic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              User: <span className="font-medium text-foreground">{trafficUsername ?? "—"}</span>
            </div>
            <div className="h-64 w-full rounded-md border bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficChartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis width={60} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="downKbps" stroke="#2563eb" dot={false} name="Down (KB/s)" />
                  <Line type="monotone" dataKey="upKbps" stroke="#16a34a" dot={false} name="Up (KB/s)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-muted-foreground">
              Updates every 2s (based on session byte counters).
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTraffic}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
