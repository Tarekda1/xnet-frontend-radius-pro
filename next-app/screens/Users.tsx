import React, { useState, useCallback, useMemo, useReducer, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
    Plus, 
    RefreshCw, 
    Users as UsersIcon, 
    Wifi, 
    UserCheck, 
    UserX, 
    Download,
    Upload,
    Filter,
    PieChart,
    Activity,
    Shield,
    Trash2,
    X,
    Server,
    Gauge,
    Layers
} from 'lucide-react';
import Link from "next/link";
import SearchBar from '@/components/SearchBar';
import UsersTable from '@/components/UsersTable';
import AddUserModal from '../components/AddUserModal';
import useUsers from '../hooks/useUsers';
import { User } from '../types/api';
// Loader import removed as unused
import { Skeleton } from "@/components/ui/skeleton";
// Tabs imports removed as unused
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { notify } from "@/lib/notify";
import { MESSAGES } from "@/constants/messages";
import QueryState from "@/components/QueryState";
import ActionConfirmDialog from "@/components/ActionConfirmDialog";
import { useProfiles } from "@/hooks/useProfiles";
import { apiClient } from "@/api/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCsv } from "@/lib/csv";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { usersPageInitialState, usersPageReducer } from "./usersPageReducer";
import { useSearchParams } from "@/navigation/urlSearchParams";
import { useRouter } from "next/navigation";
import SavedViews from "@/components/SavedViews";
import FilterPills from "@/components/FilterPills";
import { isUserAtRisk } from "@/lib/userHealth";
import IconActionButton from "@/components/IconActionButton";
import StatCard from "@/components/StatCard";
import { CountUpNumber, ProgressRing, Sparkline } from "@/components/viz";
import { useTranslation } from "react-i18next";

type UsersFleetMetrics = {
    total: number;
    online: number;
    monthlyExceeded: number;
    byStatus: Record<string, number>;
    trends: {
        onlineDaily: Array<{ day: string; count: number }>;
        newUsersWeekly: Array<{ week: string; count: number }>;
    };
};

const STATUS_SEGMENTS: Array<{ key: string; label: string; barClass: string; dotClass: string }> = [
    { key: "active", label: "Active", barClass: "bg-emerald-500/85 hover:bg-emerald-500", dotClass: "bg-emerald-500" },
    { key: "suspended", label: "Suspended", barClass: "bg-red-500/85 hover:bg-red-500", dotClass: "bg-red-500" },
    { key: "inactive", label: "Inactive", barClass: "bg-slate-400/85 hover:bg-slate-400", dotClass: "bg-slate-400" },
    { key: "expired", label: "Expired", barClass: "bg-amber-500/85 hover:bg-amber-500", dotClass: "bg-amber-500" },
    { key: "terminated", label: "Terminated", barClass: "bg-zinc-600/85 hover:bg-zinc-600", dotClass: "bg-zinc-600" },
];

type AuditLogRow = {
    id: number;
    message: string;
    meta: any;
    timestamp: string;
};

function formatAuditTitle(action: string, meta: any): { title: string; detail?: string } {
    const a = String(action || "");
    const m = meta ?? {};

    const pretty =
        a === "users.resetMac"
            ? "Reset MAC"
            : a === "users.resetDailyQuota"
              ? "Reset daily quota"
              : a === "users.resetMonthlyQuota"
                ? "Reset monthly traffic"
                : a === "users.bulk.resetMac"
                  ? "Bulk reset MAC"
                  : a === "users.bulk.setStatus"
                    ? "Bulk set user status"
                    : a === "users.update"
                      ? "Update user"
                      : a === "users.create"
                        ? "Create user"
                        : a === "users.delete"
                          ? "Delete user"
                          : a || "Activity";

    if (a === "users.update") {
        const ch = (m as any)?.changed ?? {};
        const status = ch?.accountStatus;
        if (status?.from && status?.to && status.from !== status.to) {
            return {
                title: status.to === "suspended" ? "Suspend user" : status.to === "active" ? "Activate user" : pretty,
                detail: `${status.from} → ${status.to}`,
            };
        }
        const prof = ch?.profileId;
        if (prof?.from && prof?.to && prof.from !== prof.to) {
            return { title: "Change profile", detail: `#${prof.from} → #${prof.to}` };
        }
    }

    if (a === "users.bulk.setStatus") {
        const s = String((m as any)?.accountStatus ?? "");
        if (s) return { title: s === "suspended" ? "Bulk suspend users" : s === "active" ? "Bulk activate users" : pretty, detail: s };
    }

    return { title: pretty };
}

// Loaded on demand: recharts stays out of the main /users/list bundle.
const UsageChart = dynamic(() => import("@/components/charts/ProfileDistributionChart"), {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
});

const AuditActivityTimeline = ({ enabled }: { enabled: boolean }) => {
    const auditQuery = useQuery({
        queryKey: ["audit", "users", "recent"],
        queryFn: async () => {
            const resp = await apiClient.get("/audit", { params: { limit: 8, actionPrefix: "users." } });
            const rows = (resp?.data?.data ?? []) as AuditLogRow[];
            return Array.isArray(rows) ? rows : [];
        },
        enabled,
        refetchInterval: 30000,
        staleTime: 10000,
    });

    const items = useMemo(() => {
        const rows = auditQuery.data ?? [];
        return rows.map((e) => {
            const meta = (e as any)?.meta ?? {};
            const actor = meta?.actor?.username ?? "—";
            const targets = Array.isArray(meta?.targets) ? meta.targets : [];
            const primaryTarget = targets[0] ?? null;
            const action = String(e.message ?? "").replace(/^audit\./, "") || "—";
            const ts = e.timestamp ? new Date(e.timestamp) : null;
            const fmt = formatAuditTitle(action, meta);
            return { id: e.id, actor, primaryTarget, title: fmt.title, detail: fmt.detail, ts };
        });
    }, [auditQuery.data]);

    if (auditQuery.isLoading) {
        return <div className="text-sm text-muted-foreground">Loading activity…</div>;
    }
    if (auditQuery.error) {
        return <div className="text-sm text-red-600">Failed to load activity.</div>;
    }
    if (items.length === 0) {
        return <div className="text-sm text-muted-foreground">No recent user activity.</div>;
    }

    return (
        <div className="space-y-3">
            {items.map((e) => (
                <div
                    key={String(e.id)}
                    className="group relative rounded-lg border border-transparent p-3 transition-all duration-300 hover:border-primary/25 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 hover:shadow-md dark:hover:from-primary/10 dark:hover:to-primary/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                                {e.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                                Actor: {e.actor}
                                {e.primaryTarget ? ` • Target: ${String(e.primaryTarget)}` : ""}
                                {e.detail ? ` • ${e.detail}` : ""}
                            </p>
                        </div>
                        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                            {e.ts ? e.ts.toLocaleTimeString() : "—"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BulkActions = ({ 
    selectedUsers, 
    onBulkAction, 
    onSelectAll, 
    allUsers,
    profiles,
    isBulkActionInProgress = false,
}: { 
    selectedUsers: Set<number>;
    onBulkAction: (action: string) => void;
    onSelectAll: (selected: boolean) => void;
    allUsers: User[];
    profiles: { id?: number; profileName: string }[];
    isBulkActionInProgress?: boolean;
}) => {
    const isAllSelected = selectedUsers.size === allUsers.length;
    const [profileId, setProfileId] = useState<string>("");
    const { user: authUser } = useAuth();
    const canManageUsers = useMemo(() => canAny(authUser, ["users.view", "reseller.users.manage"]), [authUser]);
    const manageUsersReason = "You don't have permission to manage users.";

    return (
        <div className="sticky top-2 z-10 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-violet-50/50 p-4 shadow-md dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onSelectAll}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div>
                        <Label className="text-sm font-semibold text-foreground">
                            {selectedUsers.size} of {allUsers.length} selected
                        </Label>
                        <p className="text-xs text-muted-foreground">Bulk actions apply to the current selection</p>
                    </div>
                </div>
                
                {selectedUsers.size > 0 && (
                    <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:ml-4">
                        <IconActionButton
                            label={!canManageUsers ? manageUsersReason : "Suspend selected users"}
                            onClick={() => onBulkAction('suspend')}
                            disabled={!canManageUsers || isBulkActionInProgress}
                            icon={<UserX className="h-4 w-4" />}
                            className="border border-orange-200 bg-orange-50 text-orange-700 transition-all duration-300 hover:border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/45 dark:text-orange-200 dark:hover:bg-orange-950/65"
                        />
                        <IconActionButton
                            label={!canManageUsers ? manageUsersReason : "Activate selected users"}
                            onClick={() => onBulkAction('activate')}
                            disabled={!canManageUsers || isBulkActionInProgress}
                            icon={<UserCheck className="h-4 w-4" />}
                            className="border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200 dark:hover:bg-emerald-950/65"
                        />
                        <IconActionButton
                            label="Export selected users"
                            onClick={() => onBulkAction('export')}
                            icon={<Download className="h-4 w-4" />}
                            className="border border-blue-200 bg-blue-50 text-blue-700 transition-all duration-300 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/55"
                        />
                        <IconActionButton
                            label={!canManageUsers ? manageUsersReason : "Reset MAC for selected users"}
                            onClick={() => onBulkAction('reset-mac')}
                            disabled={!canManageUsers || isBulkActionInProgress}
                            icon={<RefreshCw className="h-4 w-4" />}
                            className="border border-purple-200 bg-purple-50 text-purple-700 transition-all duration-300 hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/45 dark:text-purple-200 dark:hover:bg-purple-950/65"
                        />

                        <div className="flex items-center gap-1.5 ml-1">
                            <Select value={profileId} onValueChange={setProfileId}>
                                <SelectTrigger className="h-8 w-full bg-card/95 text-xs sm:w-[160px] dark:bg-card/80">
                                    <SelectValue placeholder="Assign profile..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {profiles.map((p) => (
                                        <SelectItem key={String(p.id)} value={String(p.id)}>
                                            {p.profileName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <IconActionButton
                                label={!canManageUsers ? manageUsersReason : !profileId ? "Select a profile first" : "Assign profile"}
                                onClick={() => onBulkAction(`assign-profile:${profileId}`)}
                                disabled={!profileId || !canManageUsers || isBulkActionInProgress}
                                icon={<UserCheck className="h-4 w-4" />}
                                className="border border-border bg-card/90 text-foreground transition-all duration-300 hover:bg-card dark:border-border/70"
                            />
                        </div>
                        <IconActionButton
                            label={!canManageUsers ? manageUsersReason : "Delete selected users"}
                            onClick={() => onBulkAction('delete')}
                            disabled={!canManageUsers || isBulkActionInProgress}
                            icon={<Trash2 className="h-4 w-4" />}
                            className="border border-red-200 bg-red-50 text-red-700 transition-all duration-300 hover:border-red-300 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/45 dark:text-red-200 dark:hover:bg-red-950/65"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const UsersPage: React.FC = () => {
    const [state, dispatch] = useReducer(usersPageReducer, usersPageInitialState);
    const {
        editingUser,
        pageSize,
        isRefreshing,
        statusFilter,
        selectedUsers,
        viewMode,
        advancedFilters,
        isImportOpen,
        importFileName,
        importRows,
        isImporting,
        isExportOpen,
        exportAllUsers,
        exportStatus,
        isExporting,
        confirmAction,
        isBulkActionInProgress,
    } = state;

    const { t } = useTranslation("screens");
    const [searchParams, setSearchParams] = useSearchParams();
    const router = useRouter();
    const savedViewsKeys = useMemo(
        () => ["q", "status", "account", "profile", "quotaExceeded", "hasMacAddress", "hasContactInfo", "ps", "view", "p"],
        []
    );

    const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
    const [filtersDraft, setFiltersDraft] = useState({ accountStatus: "" as string });

    const { user: authUser } = useAuth();
    const canSeeAudit = useMemo(() => canAny(authUser, ["users.view", "reseller.users.view"]), [authUser]);
    const canSeeLiveSessions = useMemo(
        () => canAny(authUser, ["users.online.view", "reseller.users.view"]),
        [authUser]
    );
    const {
        data,
        error,
        isLoading,
        refetch,
        setCurrentPage,
        currentPage,
        searchQuery,
        setSearchQuery,
        deleteUserMutation,
        resetMacAddressMutation
    } = useUsers(1, pageSize);
    const profilesQuery = useProfiles();

    // Fleet-wide metrics (all pages, reseller-scoped server side) — the paginated
    // list only covers the current page, so KPI cards use this endpoint instead.
    const fleetMetricsQuery = useQuery({
        queryKey: ["users", "fleet-metrics"],
        queryFn: async () => {
            const resp = await apiClient.get("/radius/users/metrics");
            return (resp?.data?.data ?? null) as UsersFleetMetrics | null;
        },
        refetchInterval: 30000,
        staleTime: 15000,
    });
    const fleet = fleetMetricsQuery.data;
    const fleetStatusTotal = useMemo(
        () => Object.values(fleet?.byStatus ?? {}).reduce((acc, n) => acc + n, 0),
        [fleet?.byStatus]
    );
    const fleetSparks = useMemo(() => ({
        newUsers: (fleet?.trends?.newUsersWeekly ?? []).map((p) => p.count),
        onlineDaily: (fleet?.trends?.onlineDaily ?? []).map((p) => p.count),
    }), [fleet?.trends]);

    // Backend sometimes returns either:
    // - { users, totalPages, ... } (normal list/search)
    // - [] (legacy "no users found" response)
    const serverUsersBase = useMemo<User[]>(() => {
        const d: any = (data as any)?.data;
        if (Array.isArray(d)) return d as User[];
        return (d?.users ?? []) as User[];
    }, [data]);

    // Live online status (avoids stale cached user-list "isOnline")
    const liveOnlineQuery = useOnlineUsers("", 1, 5000, {
        enabled: Boolean(canSeeLiveSessions),
        refetchInterval: 10000,
    });
    const liveOnlineSet = useMemo(() => {
        const rows = (liveOnlineQuery.data?.data ?? []) as any[];
        const set = new Set<string>();
        for (const r of rows) {
            const username = String(r?.session_username ?? "").trim();
            if (!username) continue;
            const status = String(r?.session_status ?? "").toLowerCase();
            if (status === "disconnected") continue;
            set.add(username);
        }
        return set;
    }, [liveOnlineQuery.data]);

    const serverUsers = useMemo<User[]>(() => {
        if (!canSeeLiveSessions) return serverUsersBase;
        // If the live query hasn't loaded (or errored), fall back to server-provided isOnline.
        if (!liveOnlineQuery.data) return serverUsersBase;
        return serverUsersBase.map((u) => ({
            ...u,
            isOnline: liveOnlineSet.has(String(u.username ?? "")),
        }));
    }, [serverUsersBase, canSeeLiveSessions, liveOnlineQuery.data, liveOnlineSet]);

    const isSearching = Boolean(searchQuery?.trim());

    // URL sync: initialize from URL on mount
    useEffect(() => {
        const q = searchParams.get("q") ?? "";
        const status = searchParams.get("status") ?? "";
        const accountFromUrl = searchParams.get("account") ?? "";
        const profile = searchParams.get("profile") ?? "all";
        const quotaExceeded = searchParams.get("quotaExceeded") === "true";
        const hasMacAddress = searchParams.get("hasMacAddress") === "true";
        const hasContactInfo = searchParams.get("hasContactInfo") === "true";
        const ps = parseInt(searchParams.get("ps") ?? "", 10);
        const view = (searchParams.get("view") ?? "table") as "table" | "cards" | "analytics";
        const p = parseInt(searchParams.get("p") ?? "", 10);
        if (q) setSearchQuery(q);

        let accountStatus = accountFromUrl;
        if (!accountStatus && (status === "active" || status === "suspended")) {
            accountStatus = status;
        }
        const connectivityStatus =
            status && status !== "active" && status !== "suspended" ? status : "";
        if (connectivityStatus) dispatch({ type: "SET_STATUS_FILTER", payload: connectivityStatus });
        else if (accountStatus) dispatch({ type: "SET_STATUS_FILTER", payload: "" });

        if (
            profile !== "all" ||
            quotaExceeded ||
            hasMacAddress ||
            hasContactInfo ||
            accountFromUrl ||
            status === "active" ||
            status === "suspended"
        ) {
            dispatch({
                type: "SET_ADVANCED_FILTERS",
                payload: { accountStatus, profile, quotaExceeded, hasMacAddress, hasContactInfo },
            });
        }
        if (Number.isFinite(ps) && ps > 0) dispatch({ type: "SET_PAGE_SIZE", payload: ps });
        if (["table", "cards", "analytics"].includes(view)) dispatch({ type: "SET_VIEW_MODE", payload: view });
        if (Number.isFinite(p) && p > 0) setCurrentPage(p);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // URL sync: persist state to URL
    useEffect(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (searchQuery) next.set("q", searchQuery); else next.delete("q");
            if (advancedFilters.accountStatus) next.set("account", advancedFilters.accountStatus); else next.delete("account");
            if (statusFilter) next.set("status", statusFilter); else next.delete("status");
            if (advancedFilters.profile !== "all") next.set("profile", advancedFilters.profile); else next.delete("profile");
            if (advancedFilters.quotaExceeded) next.set("quotaExceeded", "true"); else next.delete("quotaExceeded");
            if (advancedFilters.hasMacAddress) next.set("hasMacAddress", "true"); else next.delete("hasMacAddress");
            if (advancedFilters.hasContactInfo) next.set("hasContactInfo", "true"); else next.delete("hasContactInfo");
            next.set("ps", String(pageSize));
            next.set("view", viewMode);
            next.set("p", String(currentPage));
            return next;
        }, { replace: true } as any);
    }, [searchQuery, statusFilter, advancedFilters, pageSize, viewMode, currentPage, setSearchParams]);

    // Enhanced filtering with advanced filters
    const filteredUsers = React.useMemo(() => {
        let filtered = serverUsers;

        const effectiveAccountStatus =
            advancedFilters.accountStatus ||
            (statusFilter === "active" || statusFilter === "suspended" ? statusFilter : "");
        if (effectiveAccountStatus) {
            const want = effectiveAccountStatus.toLowerCase();
            filtered = filtered.filter((user) => String(user.accountStatus ?? "").toLowerCase() === want);
        }

        // Connectivity / risk / profile quick filters (not account status)
        if (statusFilter && !["active", "suspended"].includes(statusFilter)) {
            filtered = filtered.filter((user) => {
                switch (statusFilter) {
                    case "risk":
                        return isUserAtRisk(user);
                    case "online":
                        return user.isOnline === true;
                    case "offline":
                        return user.isOnline === false;
                    case "profile:premium":
                        return user.profile.profileName.toLowerCase() === "premium";
                    case "profile:basic":
                        return user.profile.profileName.toLowerCase() === "basic";
                    default:
                        return true;
                }
            });
        }

        // Advanced filters
        if (advancedFilters.profile && advancedFilters.profile !== 'all') {
            filtered = filtered.filter(user => 
                user.profile.profileName.toLowerCase() === advancedFilters.profile.toLowerCase()
            );
        }

        if (advancedFilters.quotaExceeded) {
            filtered = filtered.filter(user => user.isMonthlyExceeded);
        }

        if (advancedFilters.hasMacAddress) {
            filtered = filtered.filter(user => user.macAddress?.macAddress);
        }

        if (advancedFilters.hasContactInfo) {
            filtered = filtered.filter(user => 
                user.userDetails?.email || user.userDetails?.phoneNumber
            );
        }

        return filtered;
    }, [serverUsers, statusFilter, advancedFilters]);

    // Enhanced metrics with trends
    const metrics = useMemo(() => {
        const allUsers = serverUsers;
        const active = filteredUsers.filter(u => u.accountStatus === 'active').length;
        const suspended = filteredUsers.filter(u => u.accountStatus === 'suspended').length;
        const online = filteredUsers.filter(u => u.isOnline).length;
        const offline = filteredUsers.filter(u => !u.isOnline).length;
        const premium = filteredUsers.filter(u => u.profile.profileName.toLowerCase() === 'premium').length;
        const basic = filteredUsers.filter(u => u.profile.profileName.toLowerCase() === 'basic').length;
        const quotaExceeded = filteredUsers.filter(u => u.isMonthlyExceeded).length;
        const riskUsers = filteredUsers.filter(isUserAtRisk).length;
        const onlinePct = allUsers.length ? Math.round((online / allUsers.length) * 100) : 0;

        const onlineTrend: 'up' | 'down' | 'neutral' = online > allUsers.length / 2 ? 'up' : 'down';
        const quotaTrend: 'up' | 'down' | 'neutral' = quotaExceeded > 0 ? 'up' : 'neutral';

        return {
            total: allUsers.length,
            active,
            suspended,
            online,
            offline,
            premium,
            basic,
            quotaExceeded,
            riskUsers,
            // Calculate trends (simulated)
            onlineTrend,
            onlineTrendValue: `${onlinePct}%`,
            quotaTrend,
            quotaTrendValue: quotaExceeded > 0 ? `${quotaExceeded} users` : undefined
        };
    }, [filteredUsers, serverUsers]);

    const handleSearch = useCallback((term: string) => {
        setSearchQuery(term);
        setCurrentPage(1);
    }, [setSearchQuery, setCurrentPage]);

    const canManageUsers = useMemo(() => canAny(authUser, ["users.view", "reseller.users.manage"]), [authUser]);
    const manageUsersReason = "You don't have permission to manage users.";
    const canResetDailyQuota = useMemo(() => canAny(authUser, ["users.resetDailyQuota", "reseller.users.manage"]), [authUser]);
    const canResetMonthlyQuota = useMemo(() => canAny(authUser, ["users.resetMonthlyQuota", "reseller.users.manage"]), [authUser]);

    const handleRefresh = useCallback(() => {
        dispatch({ type: "SET_IS_REFRESHING", payload: true });
        refetch().finally(() => {
            setTimeout(() => {
                dispatch({ type: "SET_IS_REFRESHING", payload: false });
                notify.success(MESSAGES.users.refreshedTitle, MESSAGES.users.refreshedDescription);
            }, 1000);
        });
    }, [refetch]);

    const handleAddUser = useCallback(() => {
        router.push("/users/new");
    }, [router]);

    const handleUserAdded = useCallback(() => {
        refetch();
        dispatch({ type: "SET_ADD_USER_MODAL_OPEN", payload: false });
        dispatch({ type: "SET_EDITING_USER", payload: null });
    }, [refetch]);

    const handleCloseModal = useCallback(() => {
        dispatch({ type: "SET_ADD_USER_MODAL_OPEN", payload: false });
        dispatch({ type: "SET_EDITING_USER", payload: null });
    }, []);

    const handleQuickFilter = useCallback((filter: string) => {
        switch (filter) {
            case "all":
                dispatch({ type: "SET_STATUS_FILTER", payload: "" });
                dispatch({
                    type: "SET_ADVANCED_FILTERS",
                    payload: { ...advancedFilters, accountStatus: "" },
                });
                break;
            case "suspended":
                dispatch({ type: "SET_STATUS_FILTER", payload: "" });
                dispatch({
                    type: "SET_ADVANCED_FILTERS",
                    payload: { ...advancedFilters, accountStatus: "suspended" },
                });
                break;
            case "online":
                dispatch({ type: "SET_STATUS_FILTER", payload: "online" });
                break;
            case "offline":
                dispatch({ type: "SET_STATUS_FILTER", payload: "offline" });
                break;
            case "risk":
                dispatch({ type: "SET_STATUS_FILTER", payload: "risk" });
                break;
            default:
                dispatch({ type: "SET_STATUS_FILTER", payload: "" });
        }
    }, [advancedFilters]);

    const quickFilterPillValue = useMemo(() => {
        if (statusFilter === "online") return "online";
        if (statusFilter === "offline") return "offline";
        if (statusFilter === "risk") return "risk";
        if (advancedFilters.accountStatus === "suspended" || statusFilter === "suspended") return "suspended";
        return "all";
    }, [statusFilter, advancedFilters.accountStatus]);

    const displayAccountFilter = useMemo(
        () =>
            advancedFilters.accountStatus ||
            (statusFilter === "active" || statusFilter === "suspended" ? statusFilter : ""),
        [advancedFilters.accountStatus, statusFilter]
    );

    useEffect(() => {
        if (isFiltersDialogOpen) {
            setFiltersDraft({ accountStatus: advancedFilters.accountStatus || "" });
        }
    }, [isFiltersDialogOpen, advancedFilters.accountStatus]);

    const currentAttributeFilter = advancedFilters.quotaExceeded
        ? "quota"
        : advancedFilters.hasMacAddress
            ? "mac"
            : advancedFilters.hasContactInfo
                ? "contact"
                : "all";

    const setAttributeFilter = useCallback((value: string) => {
        dispatch({
            type: "SET_ADVANCED_FILTERS",
            payload: {
                ...advancedFilters,
                quotaExceeded: value === "quota",
                hasMacAddress: value === "mac",
                hasContactInfo: value === "contact",
            },
        });
    }, [advancedFilters]);

    // Press "/" anywhere to jump to the search box.
    const searchBoxRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "/") return;
            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || "").toLowerCase();
            if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
            const input = searchBoxRef.current?.querySelector("input");
            if (input) {
                e.preventDefault();
                (input as HTMLInputElement).focus();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const applyAccountStatusFilter = useCallback((status: string) => {
        dispatch({
            type: "SET_ADVANCED_FILTERS",
            payload: { ...advancedFilters, accountStatus: advancedFilters.accountStatus === status ? "" : status },
        });
        if (statusFilter === "active" || statusFilter === "suspended") {
            dispatch({ type: "SET_STATUS_FILTER", payload: "" });
        }
        setCurrentPage(1);
    }, [advancedFilters, statusFilter, setCurrentPage]);

    const clearAllFilters = useCallback(() => {
        setSearchQuery("");
        dispatch({ type: "SET_STATUS_FILTER", payload: "" });
        dispatch({
            type: "SET_ADVANCED_FILTERS",
            payload: {
                accountStatus: "",
                profile: "all",
                quotaExceeded: false,
                hasMacAddress: false,
                hasContactInfo: false,
            },
        });
        setCurrentPage(1);
    }, [setSearchQuery, setCurrentPage]);

    const handleAction = useCallback((action: string, user: User) => {
        const actions = {
            edit: () => {
                dispatch({ type: "SET_EDITING_USER", payload: user });
                dispatch({ type: "SET_ADD_USER_MODAL_OPEN", payload: true });
            },
            delete: () => dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'delete-user', username: user.username } }),
            'reset-mac': () => dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'reset-mac', username: user.username } }),
            // Not wired in Users module yet (Live Sessions has it); keep consistent UX.
            'reset-quota': () => dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'reset-quota', username: user.username } }),
            'reset-monthly': () => dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'reset-monthly-quota', username: user.username } }),
        };

        const actionFunction = actions[action as keyof typeof actions];
        if (actionFunction) {
            actionFunction();
        } else {
            console.warn('Unknown action:', action);
        }
    }, [deleteUserMutation, resetMacAddressMutation]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        dispatch({ type: "SET_PAGE_SIZE", payload: newSize });
        setCurrentPage(1); // Reset to first page when changing page size
    }, [setCurrentPage]);

    const fetchAllUsersForExport = useCallback(async (): Promise<User[]> => {
        const pageSize = 500;
        let page = 1;
        let totalPages = 1;
        const all: User[] = [];

        while (page <= totalPages) {
            const resp = await apiClient.get("/radius/users", {
                params: { page, pageSize },
            });
            const payload = resp?.data?.data;
            const users = (payload?.users ?? []) as User[];
            all.push(...users);
            totalPages = Number(payload?.totalPages ?? 1);
            page += 1;
        }

        return all;
    }, []);

    const executeExportUsers = useCallback(async () => {
        dispatch({ type: "SET_IS_EXPORTING", payload: true });
        try {
            const sourceUsers = exportAllUsers ? await fetchAllUsersForExport() : filteredUsers;
            const exportableUsers = sourceUsers.filter((u) => {
                if (exportStatus === "all") return true;
                return String(u.accountStatus ?? "").toLowerCase() === exportStatus;
            });

            if (!exportableUsers.length) {
                notify.error(MESSAGES.users.exportEmptyTitle, MESSAGES.users.exportEmptyDescription);
                return;
            }

            const xlsx = await import("xlsx");
            const cols = ["username", "fullName", "phoneNumber", "email", "profile", "accountStatus", "isOnline", "macAddress", "lastTimeActive"] as const;
            const aoa = [
                [...cols],
                ...exportableUsers.map((u) => ([
                    u.username ?? "",
                    u.userDetails?.fullName ?? "",
                    u.userDetails?.phoneNumber ?? "",
                    u.userDetails?.email ?? "",
                    u.profile?.profileName ?? "",
                    u.accountStatus ?? "",
                    u.isOnline ? "true" : "false",
                    u.macAddress?.macAddress ?? "",
                    u.lastTimeActive ?? "",
                ])),
            ];

            const ws = xlsx.utils.aoa_to_sheet(aoa);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Users");

            const date = new Date().toISOString().split("T")[0];
            const scopeSuffix = exportAllUsers ? "_all" : "_current";
            const statusSuffix = exportStatus === "all" ? "_status-all" : `_status-${exportStatus}`;
            const filename = `users${scopeSuffix}${statusSuffix}_${date}.xlsx`;
            xlsx.writeFile(wb, filename);

            notify.success(MESSAGES.users.exportSuccessTitle, `${exportableUsers.length} users exported to ${filename}`);
            dispatch({ type: "SET_EXPORT_OPEN", payload: false });
        } catch (e) {
            console.error(e);
            notify.error("Export failed", "Could not generate Excel file.");
        } finally {
            dispatch({ type: "SET_IS_EXPORTING", payload: false });
        }
    }, [exportAllUsers, exportStatus, fetchAllUsersForExport, filteredUsers]);

    const handleImportFile = useCallback(async (file: File | null) => {
        dispatch({ type: "SET_IMPORT_ROWS", payload: [] });
        dispatch({ type: "SET_IMPORT_FILE_NAME", payload: file?.name ?? "" });
        if (!file) return;

        const text = await file.text();
        const parsed = parseCsv(text).filter((r) => r.some((c) => String(c ?? "").trim().length > 0));
        if (!parsed.length) {
            notify.error("Import failed", "CSV file is empty.");
            return;
        }

        const header = (parsed[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());
        const mapKey = (k: string) => {
            const key = k.replace(/\s+/g, "");
            if (["username", "user", "login"].includes(key)) return "username";
            if (["password", "pass"].includes(key)) return "password";
            if (["profileid", "profile_id", "profile"].includes(key)) return "profileId";
            if (["accountstatus", "status"].includes(key)) return "accountStatus";
            if (["fullname", "name"].includes(key)) return "fullName";
            if (["phonenumber", "phone"].includes(key)) return "phoneNumber";
            if (["email"].includes(key)) return "email";
            if (["address"].includes(key)) return "address";
            return key;
        };

        const keys = header.map(mapKey);
        const out: Array<{ raw: Record<string, string>; errors: string[] }> = [];

        for (let idx = 1; idx < parsed.length; idx++) {
            const row = parsed[idx] ?? [];
            const raw: Record<string, string> = {};
            keys.forEach((k, i) => {
                raw[k] = String(row[i] ?? "").trim();
            });
            const errors: string[] = [];
            const username = raw.username?.trim();
            const password = raw.password?.trim();
            const profileId = Number(raw.profileId);

            if (!username) errors.push("username is required");
            if (!password) errors.push("password is required");
            if (!Number.isFinite(profileId) || profileId <= 0) errors.push("profileId must be a positive number");

            out.push({ raw, errors });
        }

        dispatch({ type: "SET_IMPORT_ROWS", payload: out });
    }, []);

    const runImport = useCallback(async () => {
        const valid = importRows.filter((r) => r.errors.length === 0).map((r) => r.raw);
        if (!valid.length) {
            notify.error("Import", "No valid rows to import.");
            return;
        }

        dispatch({ type: "SET_IS_IMPORTING", payload: true });
        try {
            const resp = await apiClient.post("/radius/users/bulk/create", {
                users: valid.map((r) => ({
                    username: r.username,
                    password: r.password,
                    profileId: Number(r.profileId),
                    accountStatus: (r.accountStatus || "active") as any,
                    fullName: r.fullName,
                    address: r.address,
                    phoneNumber: r.phoneNumber,
                    email: r.email,
                })),
            });

            const created = Number(resp?.data?.data?.created ?? 0);
            const failed = Number(resp?.data?.data?.failed ?? 0);
            const results = resp?.data?.data?.results as Array<{ username: string; ok: boolean; error?: string }> | undefined;
            await refetch();
            if (failed > 0 && Array.isArray(results)) {
                const firstErrors = results
                    .filter((x) => !x.ok)
                    .slice(0, 5)
                    .map((x) => `${x.username || "(missing username)"}: ${x.error || "failed"}`);
                notify.error("Import completed with errors", `${created} created, ${failed} failed.\n${firstErrors.join("\n")}`);
            } else {
                notify.success("Import complete", `${created} created, ${failed} failed.`);
            }
            dispatch({ type: "SET_IMPORT_OPEN", payload: false });
            dispatch({ type: "RESET_IMPORT_STATE" });
        } finally {
            dispatch({ type: "SET_IS_IMPORTING", payload: false });
        }
    }, [importRows, refetch]);

    // New handlers for enhanced features
    const handleSelectAll = useCallback((selected: boolean) => {
        if (selected) {
            dispatch({ type: "SET_SELECTED_USERS", payload: new Set(filteredUsers.map(u => u.id)) });
        } else {
            dispatch({ type: "SET_SELECTED_USERS", payload: new Set() });
        }
    }, [filteredUsers]);

    const handleToggleSelected = useCallback((userId: number, selected: boolean) => {
        const next = new Set(selectedUsers);
        if (selected) next.add(userId);
        else next.delete(userId);
        dispatch({ type: "SET_SELECTED_USERS", payload: next });
    }, [selectedUsers]);

    const handleBulkAction = useCallback((action: string) => {
        const selectedUserList = filteredUsers.filter(u => selectedUsers.has(u.id));
        const usernames = selectedUserList.map((u) => u.username).filter(Boolean);
        
        switch (action) {
            case 'suspend':
                dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'bulk', action: 'suspend', usernames } });
                break;
            case 'activate':
                dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'bulk', action: 'activate', usernames } });
                break;
            case 'export':
                dispatch({ type: "SET_EXPORT_OPEN", payload: true });
                break;
            case 'reset-mac':
                dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'bulk', action: 'reset-mac', usernames } });
                break;
            case 'delete':
                dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'bulk', action: 'delete', usernames } });
                break;
            default: {
                if (action.startsWith('assign-profile:')) {
                    const idStr = action.split(':')[1];
                    const pid = Number(idStr);
                    const p = (profilesQuery.data?.data ?? []).find((x: any) => Number(x.id) === pid);
                    dispatch({ type: "SET_CONFIRM_ACTION", payload: { kind: 'bulk', action: 'assign-profile', usernames, profileId: pid, profileName: p?.profileName } });
                }
            }
        }
    }, [selectedUsers, filteredUsers, profilesQuery.data?.data]);

    return (
        <>
        <ActionConfirmDialog
            open={Boolean(confirmAction)}
            onOpenChange={(open) => {
                if (!open) dispatch({ type: "SET_CONFIRM_ACTION", payload: null });
            }}
            title={
                confirmAction?.kind === 'delete-user'
                    ? 'Delete user?'
                    : confirmAction?.kind === 'reset-mac'
                      ? 'Reset MAC address?'
                      : confirmAction?.kind === 'reset-quota'
                        ? 'Reset quota?'
                      : confirmAction?.kind === 'reset-monthly-quota'
                        ? 'Reset monthly traffic?'
                        : confirmAction?.kind === 'bulk'
                          ? confirmAction.action === 'delete'
                            ? `Delete ${confirmAction.usernames.length} users?`
                            : confirmAction.action === 'suspend'
                              ? `Suspend ${confirmAction.usernames.length} users?`
                              : confirmAction.action === 'activate'
                                ? `Activate ${confirmAction.usernames.length} users?`
                                : confirmAction.action === 'reset-mac'
                                  ? `Reset MAC for ${confirmAction.usernames.length} users?`
                                  : `Assign profile to ${confirmAction.usernames.length} users?`
                          : 'Confirm action'
            }
            description={
                confirmAction?.kind === 'delete-user'
                    ? `This will permanently delete ${confirmAction.username}.`
                    : confirmAction?.kind === 'reset-mac'
                      ? `This will clear the stored MAC binding for ${confirmAction.username}.`
                      : confirmAction?.kind === 'reset-quota'
                        ? `This will reset the daily quota counters for ${confirmAction.username}.`
                      : confirmAction?.kind === 'reset-monthly-quota'
                        ? `This will reset the monthly traffic counters for ${confirmAction.username}.`
                        : confirmAction?.kind === 'bulk'
                          ? `${confirmAction.action === 'assign-profile' ? `Profile: ${confirmAction.profileName ?? confirmAction.profileId}` + '\n' : ''}Users affected: ${confirmAction.usernames.slice(0, 10).join(', ')}${confirmAction.usernames.length > 10 ? '…' : ''}`
                          : undefined
            }
            confirmText={
                confirmAction?.kind === 'delete-user' || (confirmAction?.kind === 'bulk' && confirmAction.action === 'delete')
                    ? 'Delete'
                    : 'Confirm'
            }
            confirmTone={
                confirmAction?.kind === 'delete-user' || (confirmAction?.kind === 'bulk' && confirmAction.action === 'delete')
                    ? 'destructive'
                    : 'default'
            }
            onConfirm={async () => {
                if (!confirmAction) return;
                dispatch({ type: "SET_BULK_ACTION_IN_PROGRESS", payload: true });
                try {
                if (confirmAction.kind === 'delete-user') {
                    await deleteUserMutation.mutateAsync(confirmAction.username);
                    await refetch();
                    return;
                }
                if (confirmAction.kind === 'reset-mac') {
                    await resetMacAddressMutation.mutateAsync(confirmAction.username);
                    await refetch();
                    return;
                }
                if (confirmAction.kind === 'reset-quota') {
                    await apiClient.put(`/radius/users/resetQuota/${encodeURIComponent(confirmAction.username)}`);
                    await refetch();
                    notify.success("Quota reset", `Daily quota reset for ${confirmAction.username}.`);
                    return;
                }
                if (confirmAction.kind === 'reset-monthly-quota') {
                    await apiClient.put(`/radius/users/resetMonthlyQuota/${encodeURIComponent(confirmAction.username)}`);
                    await refetch();
                    notify.success("Quota reset", `Monthly traffic reset for ${confirmAction.username}.`);
                    return;
                }
                if (confirmAction.kind === 'bulk') {
                    const usernames = confirmAction.usernames;
                    if (!usernames.length) return;

                    try {
                        if (confirmAction.action === 'suspend' || confirmAction.action === 'activate') {
                            const accountStatus = confirmAction.action === 'suspend' ? 'suspended' : 'active';
                            const resp = await apiClient.post("/radius/users/bulk/set-status", {
                                usernames,
                                accountStatus,
                                dryRun: false,
                            });
                            const updated = resp?.data?.data?.updated ?? usernames.length;
                            await refetch();
                            dispatch({ type: "SET_SELECTED_USERS", payload: new Set() });
                            notify.success("Bulk action", `${updated} users set to ${accountStatus}.`);
                            return;
                        }

                        if (confirmAction.action === 'reset-mac') {
                            const resp = await apiClient.post("/radius/users/bulk/reset-mac", {
                                usernames,
                                dryRun: false,
                            });
                            const deleted = resp?.data?.data?.deleted ?? resp?.data?.data?.willDelete ?? 0;
                            await refetch();
                            dispatch({ type: "SET_SELECTED_USERS", payload: new Set() });
                            notify.success("Bulk action", `MAC reset for ${deleted} users.`);
                            return;
                        }

                        if (confirmAction.action === 'assign-profile') {
                            const profileId = confirmAction.profileId;
                            if (!profileId) {
                                notify.error("Bulk action failed", "Missing profileId.");
                                return;
                            }
                            const resp = await apiClient.post("/radius/users/bulk/assign-profile", {
                                usernames,
                                profileId,
                                dryRun: false,
                            });
                            const updated = resp?.data?.data?.updated ?? usernames.length;
                            await refetch();
                            dispatch({ type: "SET_SELECTED_USERS", payload: new Set() });
                            notify.success("Bulk action", `${updated} users assigned profile ${confirmAction.profileName ?? profileId}.`);
                            return;
                        }

                        if (confirmAction.action === 'delete') {
                            const resp = await apiClient.post("/radius/users/bulk/delete", {
                                usernames,
                                dryRun: false,
                            });
                            const deleted = resp?.data?.data?.deleted ?? 0;
                            await refetch();
                            dispatch({ type: "SET_SELECTED_USERS", payload: new Set() });
                            notify.success("Bulk action", `${deleted} users deleted.`);
                            return;
                        }
                    } catch (e: any) {
                        notify.error("Bulk action failed", e?.response?.data?.message || e?.message || "Request failed");
                    }
                }
                } finally {
                    dispatch({ type: "SET_BULK_ACTION_IN_PROGRESS", payload: false });
                }
            }}
        />

        <QueryState
            isLoading={isLoading}
            error={error}
            // Only show the full-page "empty" state when there are truly no users in the system.
            // If search returns 0 results, keep rendering the page so the user can clear the search
            // and so the table can show "No users found".
            isEmpty={!isLoading && !error && !isSearching && serverUsers.length === 0}
            onRetry={() => refetch()}
            loading={
                <div className="w-full space-y-6 py-6">
                    <PageHeader
                        title={t("users.title")}
                        subtitle={t("users.subtitle_loading")}
                        icon={UsersIcon}
                        rightContent={<Skeleton className="h-10 w-full md:w-[260px]" />}
                        actions={
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        }
                    />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <Card className="border bg-card/60">
                                <CardContent className="p-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="mt-2 h-8 w-20" />
                                    <Skeleton className="mt-2 h-3 w-28" />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-4">
                            <Card className="border bg-card/60">
                                <CardContent className="p-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="mt-2 h-8 w-20" />
                                    <Skeleton className="mt-2 h-3 w-28" />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-4">
                            <Card className="border bg-card/60">
                                <CardContent className="p-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="mt-2 h-8 w-20" />
                                    <Skeleton className="mt-2 h-3 w-28" />
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="lg:col-span-12">
                            <CardContent className="p-4">
                                <Skeleton className="h-10 w-full max-w-xl" />
                                <Skeleton className="mt-3 h-8 w-full" />
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
            }
            errorTitle="Failed to load users"
            emptyTitle="No users yet"
            emptyDescription="Create your first user to get started."
        >
        <div className="w-full min-w-0 space-y-6 py-6">
            <PageHeader 
                variant="gradient"
                title={t("users.title")}
                subtitle={t("users.subtitle")}
                icon={UsersIcon}
                actions={(
                    <div className="flex w-full flex-wrap gap-2 sm:justify-end">
                        <IconActionButton
                            label={isRefreshing ? "Refreshing..." : "Refresh"}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="border-white/25 bg-white/15 text-white shadow-sm hover:bg-white/25"
                            icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                        />
                        <IconActionButton
                            label="Export Excel"
                            onClick={() => dispatch({ type: "SET_EXPORT_OPEN", payload: true })}
                            className="border-white/25 bg-white/15 text-white shadow-sm hover:bg-white/25"
                            icon={<Download className="h-4 w-4" />}
                        />
                        <IconActionButton
                            label={!canManageUsers ? manageUsersReason : "Import CSV"}
                            onClick={() => dispatch({ type: "SET_IMPORT_OPEN", payload: true })}
                            disabled={!canManageUsers}
                            className="border-white/25 bg-white/15 text-white shadow-sm hover:bg-white/25"
                            icon={<Upload className="h-4 w-4" />}
                        />
                        <IconActionButton
                            label={!canManageUsers ? manageUsersReason : "New User"}
                            onClick={handleAddUser}
                            disabled={!canManageUsers}
                            className="border-white/25 bg-white text-slate-900 shadow-sm hover:bg-white/90"
                            icon={<Plus className="h-4 w-4" />}
                        />
                    </div>
                )}
            />

            {/* Quick links to related screens */}
            <div className="flex flex-wrap gap-2">
                {canSeeLiveSessions ? (
                    <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
                        <Link href="/online-users">
                            <Activity className="mr-2 h-4 w-4" />
                            Live sessions
                        </Link>
                    </Button>
                ) : null}
                <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
                    <Link href="/nas">
                        <Server className="mr-2 h-4 w-4" />
                        NAS devices
                    </Link>
                </Button>
                <Button variant="secondary" size="sm" className="rounded-full shadow-sm" asChild>
                    <Link href="/profiles/list">
                        <Layers className="mr-2 h-4 w-4" />
                        Profiles
                    </Link>
                </Button>
            </div>

            {/* Fleet-wide KPIs (all users, not just the current page) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {isLoading && !fleet ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="border bg-card/60">
                                <CardContent className="p-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="mt-2 h-8 w-20" />
                                    <Skeleton className="mt-2 h-3 w-28" />
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Total users"
                            value={<CountUpNumber value={fleet?.total ?? metrics.total} />}
                            sublabel={
                                fleetSparks.newUsers.length
                                    ? `+${fleetSparks.newUsers[fleetSparks.newUsers.length - 1]} new this week`
                                    : "Registered users"
                            }
                            onClick={clearAllFilters}
                            icon={
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <UsersIcon className="h-5 w-5 text-primary" />
                                </div>
                            }
                            footer={
                                fleetSparks.newUsers.length >= 2 ? (
                                    <Sparkline data={fleetSparks.newUsers} strokeClass="stroke-blue-500" />
                                ) : null
                            }
                        />
                        <StatCard
                            label="Online now"
                            value={<CountUpNumber value={fleet?.online ?? metrics.online} />}
                            sublabel={
                                fleet?.total
                                    ? `${Math.round(((fleet.online ?? 0) / fleet.total) * 100)}% of all users`
                                    : "Live RADIUS sessions"
                            }
                            onClick={() => handleQuickFilter("online")}
                            icon={
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                                    <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            }
                            footer={
                                fleetSparks.onlineDaily.length >= 2 ? (
                                    <Sparkline data={fleetSparks.onlineDaily} strokeClass="stroke-emerald-500" />
                                ) : null
                            }
                        />
                        <StatCard
                            label="Suspended"
                            value={<CountUpNumber value={fleet?.byStatus?.suspended ?? metrics.suspended} />}
                            sublabel={
                                fleet?.total
                                    ? `${Math.round(((fleet.byStatus?.suspended ?? 0) / fleet.total) * 100)}% of all users`
                                    : "Account status"
                            }
                            onClick={() => handleQuickFilter("suspended")}
                            icon={
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                            }
                        />
                        <StatCard
                            label="Quota exceeded"
                            value={<CountUpNumber value={fleet?.monthlyExceeded ?? metrics.quotaExceeded} />}
                            sublabel="Monthly traffic limit reached"
                            onClick={() => setAttributeFilter("quota")}
                            icon={
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                                    <Gauge className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            }
                        />
                    </>
                )}
            </div>

            {/* Account status distribution (fleet-wide, clickable) */}
            {fleet && fleetStatusTotal > 0 ? (
                <Card className="overflow-hidden border-border/70 shadow-sm">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">Account status distribution</span>
                                <span className="text-xs text-muted-foreground">click a segment to filter</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {fleetStatusTotal.toLocaleString()} users total
                            </span>
                        </div>
                        <div className="flex h-9 w-full overflow-hidden rounded-lg border border-border/50">
                            {STATUS_SEGMENTS.map((segment) => {
                                const count = fleet.byStatus?.[segment.key] ?? 0;
                                if (count <= 0) return null;
                                const widthPercent = (count / fleetStatusTotal) * 100;
                                const isActive = advancedFilters.accountStatus === segment.key;
                                return (
                                    <button
                                        key={segment.key}
                                        type="button"
                                        className={`relative h-full transition-all ${segment.barClass} ${
                                            isActive ? "ring-2 ring-inset ring-foreground/60" : ""
                                        }`}
                                        style={{ width: `${Math.max(widthPercent, 2)}%` }}
                                        title={`${segment.label}: ${count.toLocaleString()} users`}
                                        onClick={() => applyAccountStatusFilter(segment.key)}
                                    >
                                        {widthPercent > 12 ? (
                                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-sm">
                                                {segment.label}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {STATUS_SEGMENTS.map((segment) => {
                                const count = fleet.byStatus?.[segment.key] ?? 0;
                                const isActive = advancedFilters.accountStatus === segment.key;
                                return (
                                    <button
                                        key={segment.key}
                                        type="button"
                                        onClick={() => applyAccountStatusFilter(segment.key)}
                                        className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-muted ${
                                            isActive ? "bg-muted font-semibold" : "text-muted-foreground"
                                        }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${segment.dotClass}`} />
                                        {segment.label}
                                        <span className="tabular-nums">{count.toLocaleString()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {/* Search & filters */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <Card className="lg:col-span-12">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div ref={searchBoxRef} className="order-1 w-full md:w-[70%]">
                                <SearchBar
                                    currentSearchTerm={searchQuery}
                                    onSearch={handleSearch}
                                    placeholder="Search by username, status, or profile… (press / to focus)"
                                    className="w-full"
                                    autoSearch={false}
                                    showButton
                                />
                            </div>
                            <div className="order-3 w-full min-w-0 border-t border-border/60 pt-3">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <div className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Filters</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="whitespace-nowrap text-xs text-muted-foreground">Status</span>
                                        <FilterPills
                                            name="users-quick-filter"
                                            value={quickFilterPillValue}
                                            onChange={handleQuickFilter}
                                            options={[
                                                { value: "all", label: "All" },
                                                { value: "online", label: "Online" },
                                                { value: "offline", label: "Offline" },
                                                { value: "suspended", label: "Suspended" },
                                                { value: "risk", label: "Risk" },
                                            ]}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="whitespace-nowrap text-xs text-muted-foreground">Profile</span>
                                        <FilterPills
                                            name="users-profile-filter"
                                            value={advancedFilters.profile}
                                            onChange={(value) =>
                                                dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, profile: value } })
                                            }
                                            options={[
                                                { value: "all", label: "All" },
                                                { value: "premium", label: "Premium" },
                                                { value: "basic", label: "Basic" },
                                                { value: "business", label: "Business" },
                                            ]}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="whitespace-nowrap text-xs text-muted-foreground">Type</span>
                                        <FilterPills
                                            name="users-attribute-filter"
                                            value={currentAttributeFilter}
                                            onChange={setAttributeFilter}
                                            options={[
                                                { value: "all", label: "All" },
                                                { value: "quota", label: "Quota" },
                                                { value: "mac", label: "MAC" },
                                                { value: "contact", label: "Contact" },
                                            ]}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5"
                                        onClick={() => setIsFiltersDialogOpen(true)}
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                        Account status
                                    </Button>
                                </div>
                            </div>
                            <div className="order-2 hidden min-w-0 flex-1 items-center justify-end md:flex">
                                <div>
                                    <SavedViews
                                        storageKey="users.views"
                                        keys={savedViewsKeys}
                                        getState={() => ({
                                            q: searchQuery || "",
                                            status: statusFilter || "",
                                            account: advancedFilters.accountStatus || "",
                                            profile: advancedFilters.profile || "",
                                            quotaExceeded: advancedFilters.quotaExceeded ? "true" : "",
                                            hasMacAddress: advancedFilters.hasMacAddress ? "true" : "",
                                            hasContactInfo: advancedFilters.hasContactInfo ? "true" : "",
                                            ps: String(pageSize),
                                            view: viewMode,
                                            p: String(currentPage),
                                        })}
                                        applyState={(s) => {
                                            if (s.q !== undefined) setSearchQuery(s.q || "");
                                            if (s.status !== undefined) dispatch({ type: "SET_STATUS_FILTER", payload: s.status || "" });
                                            if (s.account !== undefined) {
                                                dispatch({
                                                    type: "SET_ADVANCED_FILTERS",
                                                    payload: { ...advancedFilters, accountStatus: s.account || "" },
                                                });
                                            }
                                            if (s.profile !== undefined) dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, profile: s.profile || "all" } });
                                            if (s.quotaExceeded !== undefined) dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, quotaExceeded: s.quotaExceeded === "true" } });
                                            if (s.hasMacAddress !== undefined) dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, hasMacAddress: s.hasMacAddress === "true" } });
                                            if (s.hasContactInfo !== undefined) dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, hasContactInfo: s.hasContactInfo === "true" } });
                                            if (s.ps) { const n = parseInt(s.ps, 10); if (Number.isFinite(n)) dispatch({ type: "SET_PAGE_SIZE", payload: n }); }
                                            if (s.view && ["table", "cards", "analytics"].includes(s.view)) dispatch({ type: "SET_VIEW_MODE", payload: s.view as "table" | "cards" | "analytics" });
                                            if (s.p) { const n = parseInt(s.p, 10); if (Number.isFinite(n) && n > 0) setCurrentPage(n); }
                                            setSearchParams((prev) => {
                                                const next = new URLSearchParams(prev);
                                                if (s.q) next.set("q", s.q); else next.delete("q");
                                                if (s.status) next.set("status", s.status); else next.delete("status");
                                                if (s.account) next.set("account", s.account); else next.delete("account");
                                                if (s.profile) next.set("profile", s.profile); else next.delete("profile");
                                                if (s.quotaExceeded) next.set("quotaExceeded", s.quotaExceeded); else next.delete("quotaExceeded");
                                                if (s.hasMacAddress) next.set("hasMacAddress", s.hasMacAddress); else next.delete("hasMacAddress");
                                                if (s.hasContactInfo) next.set("hasContactInfo", s.hasContactInfo); else next.delete("hasContactInfo");
                                                if (s.ps) next.set("ps", s.ps); else next.delete("ps");
                                                if (s.view) next.set("view", s.view); else next.delete("view");
                                                if (s.p) next.set("p", s.p); else next.delete("p");
                                                return next;
                                            }, { replace: true } as any);
                                            refetch();
                                        }}
                                        onSaved={(name) => notify.success("View saved", `Saved "${name}".`)}
                                        onDeleted={(name) => notify.success("View deleted", `Deleted "${name}".`)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {(searchQuery ||
                displayAccountFilter ||
                (statusFilter && !["active", "suspended"].includes(statusFilter)) ||
                advancedFilters.profile !== "all" ||
                advancedFilters.quotaExceeded ||
                advancedFilters.hasMacAddress ||
                advancedFilters.hasContactInfo) ? (
                <Card className="border bg-card/60">
                    <CardContent className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Active filters</span>
                            {searchQuery ? (
                                <Badge variant="secondary" className="gap-1">
                                    Search: {searchQuery}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove search filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            {displayAccountFilter ? (
                                <Badge variant="secondary" className="gap-1">
                                    Account:{" "}
                                    {displayAccountFilter === "inactive"
                                        ? "Inactive"
                                        : displayAccountFilter.charAt(0).toUpperCase() + displayAccountFilter.slice(1)}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({
                                                type: "SET_ADVANCED_FILTERS",
                                                payload: { ...advancedFilters, accountStatus: "" },
                                            });
                                            if (statusFilter === "active" || statusFilter === "suspended") {
                                                dispatch({ type: "SET_STATUS_FILTER", payload: "" });
                                            }
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove account status filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            {statusFilter && !["active", "suspended"].includes(statusFilter) ? (
                                <Badge variant="secondary" className="gap-1">
                                    Status: {statusFilter}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: "SET_STATUS_FILTER", payload: "" });
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove status filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            {advancedFilters.profile !== "all" ? (
                                <Badge variant="secondary" className="gap-1">
                                    Profile: {advancedFilters.profile}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, profile: "all" } });
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove profile filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            {advancedFilters.quotaExceeded ? (
                                <Badge variant="secondary" className="gap-1">
                                    Quota exceeded
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, quotaExceeded: false } });
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove quota exceeded filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            {advancedFilters.hasMacAddress ? (
                                <Badge variant="secondary" className="gap-1">
                                    Has MAC
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, hasMacAddress: false } });
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove has MAC filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            {advancedFilters.hasContactInfo ? (
                                <Badge variant="secondary" className="gap-1">
                                    Has contact
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: "SET_ADVANCED_FILTERS", payload: { ...advancedFilters, hasContactInfo: false } });
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center"
                                        aria-label="Remove has contact filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null}
                            <IconActionButton
                                label="Clear all filters"
                                onClick={clearAllFilters}
                                icon={<X className="h-4 w-4" />}
                                size="sm"
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {/* Clear filters CTA when no results */}
            {filteredUsers.length === 0 &&
                !isLoading &&
                (searchQuery ||
                    displayAccountFilter ||
                    (statusFilter && !["active", "suspended"].includes(statusFilter)) ||
                    advancedFilters.profile !== "all" ||
                    advancedFilters.quotaExceeded ||
                    advancedFilters.hasMacAddress ||
                    advancedFilters.hasContactInfo) && (
                <Card className="border bg-card/60">
                    <CardContent className="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
                        <p className="text-sm text-muted-foreground">
                            No users match your current filters. Clear filters to see all users.
                        </p>
                        <IconActionButton
                            label="Clear all filters"
                            onClick={clearAllFilters}
                            variant="outline"
                            icon={<X className="h-4 w-4" />}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
                <BulkActions
                    selectedUsers={selectedUsers}
                    onBulkAction={handleBulkAction}
                    onSelectAll={handleSelectAll}
                    allUsers={filteredUsers}
                    profiles={profilesQuery.data?.data ?? []}
                    isBulkActionInProgress={isBulkActionInProgress}
                />
            )}

            {/* Content based on view mode */}
            {viewMode === 'analytics' ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="border bg-card/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-card-foreground">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <PieChart className="h-5 w-5 text-primary" />
                                </div>
                                Profile Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UsageChart users={filteredUsers} />
                        </CardContent>
                    </Card>

                    <Card className="border bg-card/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-card-foreground">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AuditActivityTimeline enabled={Boolean(canSeeAudit)} />
                        </CardContent>
                    </Card>

                    <Card className="border bg-card/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-card-foreground">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                                    <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    {
                                        label: "Online rate",
                                        percent: metrics.total ? (metrics.online / metrics.total) * 100 : 0,
                                        detail: `${metrics.online.toLocaleString()} online`,
                                        tone: "auto" as const,
                                    },
                                    {
                                        label: "Active rate",
                                        percent: metrics.total ? (metrics.active / metrics.total) * 100 : 0,
                                        detail: `${metrics.active.toLocaleString()} active`,
                                        tone: "auto" as const,
                                    },
                                    {
                                        label: "Quota issues",
                                        percent: metrics.total ? (metrics.quotaExceeded / metrics.total) * 100 : 0,
                                        detail: `${metrics.quotaExceeded.toLocaleString()} exceeded`,
                                        tone: "inverse" as const,
                                    },
                                ].map((ring) => (
                                    <div key={ring.label} className="flex flex-col items-center gap-2 text-center">
                                        <div className="relative">
                                            <ProgressRing percent={ring.percent} size={88} tone={ring.tone} />
                                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
                                                {Math.round(ring.percent)}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-foreground/90">{ring.label}</div>
                                            <div className="text-[11px] text-muted-foreground">{ring.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* Users Table */
                <UsersTable
                    users={filteredUsers}
                    currentPage={currentPage}
                    totalPages={Array.isArray((data as any)?.data) ? 1 : ((data as any)?.data?.totalPages ?? 0)}
                    totalUsers={Array.isArray((data as any)?.data) ? serverUsers.length : ((data as any)?.data?.totalUsers ?? 0)}
                    onPageChange={setCurrentPage}
                    onAction={handleAction}
                    isLoading={isLoading}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    deleteUserMutation={deleteUserMutation}
                    resetMacAddressMutation={resetMacAddressMutation}
                    selectedUserIds={selectedUsers}
                    onToggleSelected={handleToggleSelected}
                    onToggleSelectAll={handleSelectAll}
                    canManageUsers={canManageUsers}
                    manageUsersReason={manageUsersReason}
                    canResetDailyQuota={canResetDailyQuota}
                    canResetMonthlyQuota={canResetMonthlyQuota}
                />
            )}

            {/* Edit User Modal (new user goes to /users/new page) */}
            {editingUser && (
                <AddUserModal
                    isOpen={!!editingUser}
                    onClose={handleCloseModal}
                    onUserAdded={handleUserAdded}
                    editingUser={editingUser}
                />
            )}

            {/* CSV Import dialog */}
            <Dialog open={isImportOpen} onOpenChange={(open) => (isImporting ? null : dispatch({ type: "SET_IMPORT_OPEN", payload: open }))}>
                <DialogContent className="sm:max-w-[920px]">
                    <DialogHeader>
                        <DialogTitle>Import Users (CSV)</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            Required columns: <span className="font-mono">username,password,profileId</span>. Optional:{" "}
                            <span className="font-mono">accountStatus,fullName,phoneNumber,email,address</span>.
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const headers = "username,password,profileId,accountStatus,fullName,phoneNumber,email,address";
                                const example = "user1,password123,1,active,John Doe,+1234567890,john@example.com,123 Main St";
                                const csv = headers + "\n" + example;
                                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "users_import_template.csv";
                                a.click();
                                URL.revokeObjectURL(url);
                                notify.success("Template downloaded", "Save the file and fill in your user data.");
                            }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download template
                        </Button>

                        <Input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) => void handleImportFile(e.target.files?.item(0) ?? null)}
                            disabled={isImporting}
                        />

                        {importFileName ? (
                            <div className="text-sm">
                                File: <span className="font-medium">{importFileName}</span>
                            </div>
                        ) : null}

                        {importRows.length ? (
                            <div className="flex items-center gap-3 text-sm">
                                <Badge variant="outline">Total: {importRows.length}</Badge>
                                <Badge variant="outline" className="border-green-500 text-green-700">
                                    Valid: {importRows.filter((r) => r.errors.length === 0).length}
                                </Badge>
                                <Badge variant="outline" className="border-red-500 text-red-700">
                                    Invalid: {importRows.filter((r) => r.errors.length > 0).length}
                                </Badge>
                            </div>
                        ) : null}

                        {importRows.length ? (
                            <div className="max-h-[420px] overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 border-b border-border bg-card/95 shadow-sm backdrop-blur-sm dark:bg-card/90">
                                        <TableRow>
                                            <TableHead className="w-[40px]">#</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead className="w-[120px]">Profile</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            <TableHead>Errors</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {importRows.slice(0, 50).map((r, idx) => (
                                            <TableRow
                                                key={idx}
                                                className={r.errors.length ? "bg-red-50/40 dark:bg-red-950/35" : ""}
                                            >
                                                <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.raw.username}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.raw.profileId}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.raw.accountStatus || "active"}</TableCell>
                                                <TableCell className="text-sm">
                                                    {r.errors.length ? r.errors.join("; ") : <span className="text-green-700 dark:text-green-400">OK</span>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {importRows.length > 50 ? (
                                    <div className="p-2 text-xs text-muted-foreground">Showing first 50 rows.</div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => dispatch({ type: "SET_IMPORT_OPEN", payload: false })} disabled={isImporting}>
                            Close
                        </Button>
                        <Button
                            onClick={() => void runImport()}
                            disabled={isImporting || importRows.filter((r) => r.errors.length === 0).length === 0}
                        >
                            {isImporting ? "Importing..." : "Create valid users"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account status & related filters */}
            <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>Filters</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Account status</Label>
                            <Select
                                value={filtersDraft.accountStatus || "all"}
                                onValueChange={(v) =>
                                    setFiltersDraft({ accountStatus: v === "all" ? "" : v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="inactive">Inactive (disabled)</SelectItem>
                                    <SelectItem value="terminated">Terminated</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Matches the user&apos;s account status from RADIUS. Inactive covers legacy &quot;disabled&quot; rows in your data.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFiltersDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                dispatch({
                                    type: "SET_ADVANCED_FILTERS",
                                    payload: { ...advancedFilters, accountStatus: filtersDraft.accountStatus },
                                });
                                if (statusFilter === "active" || statusFilter === "suspended") {
                                    dispatch({ type: "SET_STATUS_FILTER", payload: "" });
                                }
                                setCurrentPage(1);
                                setIsFiltersDialogOpen(false);
                            }}
                        >
                            Apply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export options dialog */}
            <Dialog open={isExportOpen} onOpenChange={(open) => (isExporting ? null : dispatch({ type: "SET_EXPORT_OPEN", payload: open }))}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Export Users</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="export-all-users"
                                checked={exportAllUsers}
                                onCheckedChange={(checked) => dispatch({ type: "SET_EXPORT_ALL_USERS", payload: Boolean(checked) })}
                            />
                            <Label htmlFor="export-all-users">Export all users (all pages)</Label>
                        </div>
                        <div className="space-y-2">
                            <Label>Status filter</Label>
                            <Select value={exportStatus} onValueChange={(v: "all" | "active" | "suspended") => dispatch({ type: "SET_EXPORT_STATUS", payload: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">Active only</SelectItem>
                                    <SelectItem value="suspended">Suspended only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Scope: {exportAllUsers ? "All users from server" : "Current filtered view"}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => dispatch({ type: "SET_EXPORT_OPEN", payload: false })} disabled={isExporting}>
                            Cancel
                        </Button>
                        <Button onClick={() => void executeExportUsers()} disabled={isExporting}>
                            {isExporting ? "Exporting..." : "Export"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </QueryState>
        </>
    );
};

export default UsersPage;