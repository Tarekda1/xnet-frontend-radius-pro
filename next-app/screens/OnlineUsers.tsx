// OnlineUsersPage.tsx (or wherever you host the page)
import { useMemo, useState, useCallback, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import OnlineUsersTable, { type OnlineSessionStats } from "../components/OnlineUsersTable";
import { RefreshCw, Users, Activity, AlertTriangle, Gauge, Wifi, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import IconActionButton from "@/components/IconActionButton";
import { websocketService } from "@/services/websocket";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useSearchParams } from "@/navigation/urlSearchParams";
import Link from "next/link";

type OnlineUsersMetrics = { totalOnlineUsers: number; totalActiveUsers: number };

export default function OnlineUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchFromUrl = useMemo(() => String(searchParams.get("search") ?? "").trim(), [searchParams]);
  const [search, setSearch] = useState(initialSearchFromUrl);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ fup: 0, monthlyExceeded: 0, total: 0 });
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const handleSessionStats = useCallback((stats: OnlineSessionStats) => {
    setSessionStats((prev) =>
      prev.fup === stats.fup && prev.monthlyExceeded === stats.monthlyExceeded && prev.total === stats.total
        ? prev
        : stats
    );
  }, []);

  const handleOnlineCountChange = useCallback((count: number) => {
    setOnlineCount((prev) => (prev === count ? prev : count));
  }, []);

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

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const trimmed = search.trim();
      if (trimmed) next.set("search", trimmed);
      else next.delete("search");
      return next;
    }, { replace: true } as any);
  }, [search, setSearchParams]);

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
    // Avoid artificial long loading delay on page entry.
    const timer = setTimeout(() => setIsLoading(false), 200);

    // Subscribe to WebSocket notifications
    const unsubscribe = websocketService.onNotification((data) => {
      if (data.type === 'USER_STATUS_CHANGE') {
        notify.success(MESSAGES.onlineUsers.statusUpdatedTitle, `${data.username} is now ${data.status}`);
        handleRefresh();
      }
    }, 'USER_STATUS_CHANGE');

    return () => {
      clearTimeout(timer);
      unsubscribe();
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
      <div className="w-full space-y-6 px-4 py-6 sm:px-0 animate-in fade-in-50">
        <PageHeader
          variant="gradient"
          title="Live Sessions"
          subtitle="Monitor and manage active RADIUS sessions"
          icon={Users}
          actions={
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 bg-white/20" />
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricsOnline = metricsQuery.data?.totalOnlineUsers;
  const metricsActive = metricsQuery.data?.totalActiveUsers;
  const totalOnline = Math.max(onlineCount, typeof metricsOnline === "number" ? metricsOnline : 0);
  const activeOnline = Math.max(
    0,
    Math.min(
      totalOnline,
      typeof metricsActive === "number" && metricsActive > 0 ? metricsActive : totalOnline
    )
  );
  const idleOnline = Math.max(totalOnline - activeOnline, 0);
  const secondsSinceRefresh = Math.max(0, Math.floor((nowTick - lastRefreshedAt.getTime()) / 1000));
  const autoRefreshEverySec = 15;
  const metricsUpdatedAt = Number(metricsQuery.dataUpdatedAt || 0);
  const secondsSinceMetricsUpdate = metricsUpdatedAt > 0 ? Math.max(0, Math.floor((nowTick - metricsUpdatedAt) / 1000)) : 0;
  const autoRefreshIn = metricsQuery.isFetching ? 0 : Math.max(0, autoRefreshEverySec - (secondsSinceMetricsUpdate % autoRefreshEverySec));
  const isDataStale = secondsSinceRefresh > 60;

  return (
    <div className="w-full space-y-6 px-4 py-6 sm:px-0 animate-in fade-in-50">
      <PageHeader
        variant="gradient"
        title="Live Sessions"
        subtitle="Active RADIUS sessions with daily and monthly quota cycles — same billing window as the Users list"
        icon={Activity}
        actions={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge
              className="h-7 border-white/20 bg-white/15 text-[11px] text-white"
              variant={isDataStale ? "destructive" : "secondary"}
            >
              {isDataStale ? `Stale ${secondsSinceRefresh}s` : `Fresh ${secondsSinceRefresh}s`}
            </Badge>
            <Badge className="h-7 border-white/25 bg-white/10 text-[11px] text-white/90" variant="outline">
              {metricsQuery.isFetching ? "Auto refresh…" : `Auto in ${autoRefreshIn}s`}
            </Badge>
            {sessionStats.monthlyExceeded > 0 ? (
              <Badge variant="destructive" className="h-7 text-[11px]">
                {sessionStats.monthlyExceeded} over quota
              </Badge>
            ) : null}
            <IconActionButton
              label={isRefreshing ? "Refreshing…" : "Refresh"}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-white/25 bg-white/15 text-white shadow-sm hover:bg-white/25"
              icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />}
            />
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
          <Link href="/users/list">
            <Users className="mr-2 h-4 w-4" />
            Users list
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
          <Link href="/users/list?status=online">
            <Wifi className="mr-2 h-4 w-4" />
            Online filter
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
          <Link href="/nas">
            <Server className="mr-2 h-4 w-4" />
            NAS devices
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active now"
          value={activeOnline.toLocaleString()}
          sublabel="Recent accounting updates"
          icon={
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {activeOnline > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-background" />
              ) : null}
            </div>
          }
        />
        <StatCard
          label="Total online"
          value={totalOnline.toLocaleString()}
          sublabel={idleOnline ? `${idleOnline.toLocaleString()} idle / no recent update` : "All open sessions"}
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          }
        />
        <StatCard
          label="FUP / throttled"
          value={sessionStats.fup.toLocaleString()}
          sublabel={
            sessionStats.fup
              ? `${Math.round((sessionStats.fup / Math.max(sessionStats.total, 1)) * 100)}% on current page`
              : "No fallback profiles"
          }
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          }
        />
        <StatCard
          label="Monthly exceeded"
          value={sessionStats.monthlyExceeded.toLocaleString()}
          sublabel="Over quota this billing cycle"
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Gauge className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          }
        />
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Search sessions</h2>
              <p className="text-xs text-muted-foreground">
                Last refresh {secondsSinceRefresh}s ago · {lastRefreshedAt.toLocaleTimeString()}
                {totalOnline > 0 ? ` · ${totalOnline.toLocaleString()} total online` : ""}
              </p>
            </div>
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
          <SearchBar
            currentSearchTerm={search}
            onSearch={handleSearch}
            placeholder="Search by username, full name, NAS IP or name…"
            className="w-full max-w-2xl"
            autoSearch={false}
            showButton
          />
          {search.trim() ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <Badge variant="secondary" className="gap-1">
                Search: {search}
                <button type="button" onClick={() => setSearch("")} className="inline-flex" aria-label="Clear search">
                  ×
                </button>
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <OnlineUsersTable
        search={search}
        onCountChange={handleOnlineCountChange}
        onStatsChange={handleSessionStats}
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
                    Monthly cycle follows each user&apos;s reset day or manual start date.
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
            <div className="h-64 w-full rounded-md border border-border bg-card">
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
