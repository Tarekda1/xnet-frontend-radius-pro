// OnlineUsersTable.tsx
import React, {
    useCallback,
    useMemo,
    useEffect,
    useState,
} from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    OnlineUser,
    useOnlineUsers,
} from "../hooks/useOnlineUsers";

/* ui + icons (paths may differ in your project) */
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableHead,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Loader from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";
import TableToolbar from "@/components/TableToolbar";
import TablePager from "@/components/TablePager";
import TableRowActions from "@/components/TableRowActions";
import QueryState from "@/components/QueryState";
import ActionConfirmDialog from "@/components/ActionConfirmDialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FilterPills from "@/components/FilterPills";

import {
    Clock,
    Power,
    RefreshCw,
    RotateCw,
    Settings,
    User,
    Wifi,
    HardDrive,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";

// Disconnect is handled server-side (MikroTik API / radclient fallback).

/* ───────── helpers (same logic you used before) */
const formatBytes = (b: string) => {
    const n = parseInt(b, 10);
    if (!n) return "0 Bytes";
    const k = 1024,
        units = ["Bytes", "KB", "MB", "GB", "TB"],
        i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / k ** i).toFixed(2)} ${units[i]}`;
};
const pct = (u: string, t: string) => {
    const used = parseInt(u, 10);
    const total = parseInt(t, 10);
    if (!Number.isFinite(total) || total <= 0) return 0;
    if (!Number.isFinite(used) || used <= 0) return 0;
    return Math.min((used / total) * 100, 100);
};
const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400),
        h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60),
        sec = s % 60;
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, sec && `${sec}s`]
        .filter(Boolean)
        .join(" ");
};
const formatAgo = (iso: string | null | undefined) => {
    const t = iso ? Date.parse(iso) : NaN;
    if (!Number.isFinite(t)) return "—";
    const sec = Math.max(Math.floor((Date.now() - t) / 1000), 0);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
};
const STALE_AFTER_SECONDS = 60;
const isSessionStale = (iso: string | null | undefined) => {
    const t = iso ? Date.parse(iso) : NaN;
    if (!Number.isFinite(t)) return true;
    return (Date.now() - t) / 1000 > STALE_AFTER_SECONDS;
};
const formatStatus = (s: string) =>
({ active: "Online", idle: "Idle", disconnected: "Disconnected" }[
    s.toLowerCase()
] || s);
const profileClass = (p: string) =>
    p.toLowerCase().includes("premium")
        ? "text-blue-500 font-bold"
        : p.toLowerCase().includes("basic")
            ? "text-violet-500"
            : "text-gray-700";
const profileBadge = (p: string) => {
    const l = p.toLowerCase();
    if (l === "premium")
        return (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Premium
            </Badge>
        );
    if (l === "basic")
        return (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                Basic
            </Badge>
        );
    if (l === "basicfn")
        return (
            <Badge variant="outline" className="bg-blue-100 text-purple-800 border-purple-200">
                BasicFN
            </Badge>
        );
    return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {p}
        </Badge>
    );
};

const toInt = (value: unknown) => {
    const n = typeof value === "number" ? value : parseInt(String(value ?? "0"), 10);
    return Number.isFinite(n) ? n : 0;
};

const isTruthyFallback = (value: unknown) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    const s = String(value ?? "").trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
};

// In some cases fallback profile/quota state appears before is_fallback is consistently reflected.
// Derive FUP status from multiple signals so UI matches effective behavior.
const isFupUser = (u: OnlineUser) => {
    const byFlag = isTruthyFallback((u as any).is_fallback);
    const byProfile = String(u.profile_profile_name ?? "").toLowerCase().includes("fallback");
    const dailyQuota = toInt(u.profile_daily_quota);
    const monthlyQuota = toInt(u.profile_monthly_quota);
    const dailyExceeded = dailyQuota > 0 && toInt(u.real_time_data_usage) >= dailyQuota;
    const monthlyExceeded = monthlyQuota > 0 && toInt(u.monthly_usage) >= monthlyQuota;
    return byFlag || byProfile || dailyExceeded || monthlyExceeded;
};

type UsageTone = "normal" | "warning" | "high" | "critical";

const getUsageTone = (value: number, isFup: boolean): UsageTone => {
    if (isFup || value >= 100) return "critical";
    if (value >= 90) return "high";
    if (value >= 75) return "warning";
    return "normal";
};

/* small reusable bar */
const UsageBar: React.FC<{ used: string; total: string; type: 'daily' | 'monthly'; isFup?: boolean }> = ({
    used,
    total,
    type,
    isFup = false,
}) => {
    const value = pct(used, total);
    const tone = getUsageTone(value, isFup);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "space-y-1.5 rounded-md border px-2 py-1.5",
                            tone === "critical" && "bg-red-50/70 border-red-200/70",
                            tone === "high" && "bg-orange-50/70 border-orange-200/70",
                            tone === "warning" && "bg-amber-50/70 border-amber-200/70",
                            tone === "normal" && "bg-emerald-50/60 border-emerald-200/60"
                        )}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {type === 'daily' ? 'Daily' : 'Monthly'} Usage
                            </span>
                            <span className="font-medium">
                                {formatBytes(used)} / {formatBytes(total)}
                            </span>
                        </div>
                        <Progress
                            value={value}
                            className={cn(
                                "h-2",
                                tone === "critical" && "bg-red-100",
                                tone === "high" && "bg-orange-100",
                                tone === "warning" && "bg-amber-100",
                                tone === "normal" && "bg-emerald-100"
                            )}
                            indicatorClassName={cn(
                                tone === "critical" && "bg-red-600",
                                tone === "high" && "bg-orange-500",
                                tone === "warning" && "bg-amber-500",
                                tone === "normal" && "bg-emerald-500"
                            )}
                        />
                        <div
                            className={cn(
                                "text-xs text-right",
                                tone === "critical" && "text-red-700",
                                tone === "high" && "text-orange-700",
                                tone === "warning" && "text-amber-700",
                                tone === "normal" && "text-emerald-700"
                            )}
                        >
                            {value.toFixed(1)}% used
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="space-y-1">
                        <div className="font-medium">{type === 'daily' ? 'Daily' : 'Monthly'} Usage</div>
                        <div>{formatBytes(used)} / {formatBytes(total)}</div>
                        <div className="text-sm text-muted-foreground">{value.toFixed(1)}% used</div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = status.toLowerCase();
    const tone =
        s === "active" ? "info" :
        s === "idle" ? "warning" :
        s === "disconnected" ? "danger" :
        "default";

    return (
        <StatusPill
            label={formatStatus(status)}
            tone={tone as any}
            dot
            pulseDot={s === "active"}
        />
    );
};

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MOBILE CARD ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const MobileCard: React.FC<{
    user: OnlineUser;
    onAction: (a: string, u: string) => void;
    canManageRadiusUsers: boolean;
    canResetDailyQuota: boolean;
    canResetMonthlyQuota: boolean;
    canDisconnect: boolean;
    manageReason: string;
    disconnectReason: string;
}> = React.memo(({ user, onAction, canManageRadiusUsers, canResetDailyQuota, canResetMonthlyQuota, canDisconnect, manageReason, disconnectReason }) => {
    const fup = isFupUser(user);
    return (
    <Card className={cn(
        "overflow-hidden border border-border/50 hover:border-border transition-colors",
        fup && "border-red-200 bg-red-50/30"
    )}>
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className={cn("text-lg", profileClass(user.profile_profile_name))}>
                        <Link className="hover:underline" to={`/users/${encodeURIComponent(user.session_username)}`}>
                            {user.session_username}
                        </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {user.userDetails_full_name || "—"}
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {profileBadge(user.profile_profile_name)}
                    <StatusBadge status={user.session_status} />
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">MAC Address</div>
                    <div className="flex items-center text-sm">
                        <Wifi className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {user.session_mac_address}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Last update</div>
                    <div className="flex items-center text-sm">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span title={user.session_last_update || ""}>{formatAgo(user.session_last_update)}</span>
                    </div>
                </div>
                <UsageBar
                    used={user.real_time_data_usage}
                    total={user.profile_daily_quota}
                    type="daily"
                    isFup={fup}
                />
            </div>
            <UsageBar
                used={user.monthly_usage}
                total={user.profile_monthly_quota}
                type="monthly"
                isFup={fup}
            />
        </CardContent>
        <CardFooter className="pt-2">
            <div className="flex w-full justify-end">
                <TableRowActions
                    actions={[
                        { label: "Session Details", icon: HardDrive, onClick: () => onAction("details", user.session_username) },
                        { label: "View Traffic", icon: Activity, onClick: () => onAction("view-traffic", user.session_username) },
                        { label: "Disconnect", icon: Power, onClick: () => onAction("disconnect", user.session_username), tone: "destructive" as const, disabled: !canDisconnect, disabledReason: disconnectReason },
                        { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", user.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                        { label: "Reset Quota", icon: RotateCw, onClick: () => onAction("reset-quota", user.session_username), disabled: !canResetDailyQuota, disabledReason: !canResetDailyQuota ? "You don't have permission to reset daily quota." : undefined },
                        { label: "Reset Monthly", icon: RotateCw, onClick: () => onAction("reset-monthly", user.session_username), disabled: !canResetMonthlyQuota, disabledReason: !canResetMonthlyQuota ? "You don't have permission to reset monthly quota." : undefined },
                        { label: "Change Profile", icon: Settings, onClick: () => onAction("change-profile", user.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                    ]}
                />
            </div>
        </CardFooter>
    </Card>
    );
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DESKTOP TABLE ROWS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const TableRows = function TableRows({
    users,
    onAction,
    canManageRadiusUsers,
    canResetDailyQuota,
    canResetMonthlyQuota,
    canDisconnect,
    manageReason,
    disconnectReason,
}: {
    users: OnlineUser[];
    onAction: (a: string, u: string) => void;
    canManageRadiusUsers: boolean;
    canResetDailyQuota: boolean;
    canResetMonthlyQuota: boolean;
    canDisconnect: boolean;
    manageReason: string;
    disconnectReason: string;
}) {
    return (
        <>
            {users.map((u) => {
                const fup = isFupUser(u);
                return (
                <TableRow 
                    key={u.session_username} 
                    className={cn(
                        "hover:bg-muted/50 transition-colors",
                        u.session_status === 'active' && "bg-white/50",
                        u.session_status === 'idle' && "bg-yellow-50/50",
                        isSessionStale(u.session_last_update) && "bg-amber-50/50 border-l-4 border-l-amber-500",
                        fup && "bg-red-50/60 border-l-4 border-l-red-500"
                    )}
                >
                    <TableCell className={cn(profileClass(u.profile_profile_name), "p-4")}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <div className="font-medium">
                                    <Link className="hover:underline" to={`/users/${encodeURIComponent(u.session_username)}`}>
                                        {u.session_username}
                                    </Link>
                                </div>
                                <div className="text-xs text-muted-foreground">{u.userDetails_full_name || "—"}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5">
                            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono text-sm">{u.session_mac_address}</span>
                        </div>
                    </TableCell>
                    <TableCell>{profileBadge(u.profile_profile_name)}</TableCell>
                    <TableCell>
                        <StatusBadge status={u.session_status} />
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5">
                            <HardDrive className={cn(
                                "h-3.5 w-3.5",
                                fup ? "text-red-600" : "text-green-600"
                            )} />
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-sm",
                                    fup
                                        ? "bg-red-100 text-red-700 border-red-200" 
                                        : "bg-green-100 text-green-700 border-green-200"
                                )}
                            >
                                {fup ? "Yes" : "No"}
                            </Badge>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatUptime(u.session_session_time)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm space-y-1" title={u.session_last_update || ""}>
                            <div>{formatAgo(u.session_last_update)}</div>
                            {isSessionStale(u.session_last_update) ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    Stale
                                </Badge>
                            ) : null}
                        </div>
                    </TableCell>
                    <TableCell>
                        <UsageBar
                            used={u.real_time_data_usage}
                            total={u.profile_daily_quota}
                            type="daily"
                            isFup={fup}
                        />
                    </TableCell>
                    <TableCell>
                        <UsageBar
                            used={u.monthly_usage}
                            total={u.profile_monthly_quota}
                            type="monthly"
                            isFup={fup}
                        />
                    </TableCell>
                    <TableCell className="text-center">
                        <TableRowActions
                            actions={[
                                { label: "Session Details", icon: HardDrive, onClick: () => onAction("details", u.session_username) },
                                { label: "View Traffic", icon: Activity, onClick: () => onAction("view-traffic", u.session_username) },
                                { label: "Disconnect", icon: Power, onClick: () => onAction("disconnect", u.session_username), tone: "destructive" as const, disabled: !canDisconnect, disabledReason: disconnectReason },
                                { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", u.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                                { label: "Reset Quota", icon: RotateCw, onClick: () => onAction("reset-quota", u.session_username), disabled: !canResetDailyQuota, disabledReason: !canResetDailyQuota ? "You don't have permission to reset daily quota." : undefined },
                                { label: "Reset Monthly", icon: RotateCw, onClick: () => onAction("reset-monthly", u.session_username), disabled: !canResetMonthlyQuota, disabledReason: !canResetMonthlyQuota ? "You don't have permission to reset monthly quota." : undefined },
                                { label: "Change Profile", icon: Settings, onClick: () => onAction("change-profile", u.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                            ]}
                        />
                    </TableCell>
                </TableRow>
            )})}
        </>
    );
}
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DESKTOP TABLE WRAPPER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const DesktopTable: React.FC<{
    users: OnlineUser[];
    onAction: (a: string, u: string) => void;
    canManageRadiusUsers: boolean;
    canResetDailyQuota: boolean;
    canResetMonthlyQuota: boolean;
    canDisconnect: boolean;
    manageReason: string;
    disconnectReason: string;
}> = React.memo(({ users, onAction, canManageRadiusUsers, canResetDailyQuota, canResetMonthlyQuota, canDisconnect, manageReason, disconnectReason }) => (
    <Card className="overflow-hidden border border-border/50">
        <div className="overflow-auto max-h-[70vh]">
        <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead className="w-[150px]">MAC Address</TableHead>
                    <TableHead className="w-[100px]">Profile</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[80px]">FUP</TableHead>
                    <TableHead className="w-[120px]">Uptime</TableHead>
                    <TableHead className="w-[120px]">Last update</TableHead>
                    <TableHead>Daily Usage</TableHead>
                    <TableHead>Monthly Usage</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRows
                    users={users}
                    onAction={onAction}
                    canManageRadiusUsers={canManageRadiusUsers}
                    canResetDailyQuota={canResetDailyQuota}
                    canResetMonthlyQuota={canResetMonthlyQuota}
                    canDisconnect={canDisconnect}
                    manageReason={manageReason}
                    disconnectReason={disconnectReason}
                />
            </TableBody>
        </Table>
        </div>
    </Card>
));

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MAIN TABLE COMPONENT ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
interface Props {
    search: string;
    onCountChange?: (count: number) => void;
    isRefreshing?: boolean;
    refreshToken?: number;
    onChangeProfile?: (username: string, currentProfileName?: string) => void;
    onViewTraffic?: (username: string) => void;
}

const OnlineUsersTable: React.FC<Props> = ({ 
    search, 
    onCountChange, 
    isRefreshing,
    refreshToken,
    onChangeProfile,
    onViewTraffic,
}) => {
    const { user: authUser } = useAuth();
    const canManageRadiusUsers = useMemo(() => canAny(authUser, ["users.view", "reseller.users.manage"]), [authUser]);
    const canResetDailyQuota = useMemo(() => canAny(authUser, ["users.resetDailyQuota", "reseller.users.manage"]), [authUser]);
    const canResetMonthlyQuota = useMemo(() => canAny(authUser, ["users.resetMonthlyQuota", "reseller.users.manage"]), [authUser]);
    const canDisconnect = useMemo(() => canAny(authUser, ["users.online.view", "reseller.users.manage"]), [authUser]);
    const manageReason = "You don't have permission to manage users.";
    const disconnectReason = "You don't have permission to disconnect sessions.";
    /* local pagination to keep table self-contained */
    //const [page, setPage] = useState(1);

    const {
        data,
        error,
        isLoading,
        refetch,
        limit,
        setLimit,
        page,
        setPage,
        resetDailyUserQuotaMutation,
        resetMonthlyUserQuotaMutation,
        resetMacAddressMutation,
        disconnectUserSessionMutation,
    } = useOnlineUsers(search, 1, 100);
    //search,

    const [confirm, setConfirm] = useState<
        null | { action: "reset-quota" | "reset-monthly" | "reset-mac" | "disconnect"; username: string }
    >(null);
    const [detailUsername, setDetailUsername] = useState<string | null>(null);

    const sessionDetailQuery = useQuery({
        queryKey: ["sessions", "live", detailUsername],
        queryFn: async () => {
            const resp = await apiClient.get(`/sessions/live/${encodeURIComponent(String(detailUsername))}`);
            return resp?.data?.data;
        },
        enabled: Boolean(detailUsername),
        staleTime: 5000,
    });

    const sessionRejectsQuery = useQuery({
        queryKey: ["sessions", "rejects", detailUsername],
        queryFn: async () => {
            const resp = await apiClient.get(`/sessions/rejects/${encodeURIComponent(String(detailUsername))}`, { params: { limit: 25 } });
            return resp?.data?.data ?? [];
        },
        enabled: Boolean(detailUsername),
        staleTime: 5000,
    });

    const onAction = useCallback(
        (action: string, username: string) => {
            const currentProfileName =
                (data?.data ?? []).find((u) => u.session_username === username)?.profile_profile_name;

            if (action === "reset-quota") {
                setConfirm({ action: "reset-quota", username });
                return;
            }

            if (action === "reset-monthly") {
                setConfirm({ action: "reset-monthly", username });
                return;
            }

            if (action === "reset-mac") {
                setConfirm({ action: "reset-mac", username });
                return;
            }

            if (action === "disconnect") {
                setConfirm({ action: "disconnect", username });
                return;
            }

            if (action === "change-profile") {
                onChangeProfile?.(username, currentProfileName);
                return;
            }

            if (action === "view-traffic") {
                onViewTraffic?.(username);
                return;
            }

            if (action === "details") {
                setDetailUsername(username);
                return;
            }
        },
        [resetDailyUserQuotaMutation, resetMonthlyUserQuotaMutation, resetMacAddressMutation, disconnectUserSessionMutation, refetch, onChangeProfile, onViewTraffic]
    );

    // Allow parent to trigger a refetch (e.g., top Refresh button)
    useEffect(() => {
        if (!refreshToken) return;
        // Avoid unhandled promise rejections crashing the page
        refetch().catch(() => null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshToken]);

    /* page-size select options */
    const pageSizes = useMemo(() => [10, 25, 50, 100], []);

    type StatusFilter = "all" | "active" | "idle" | "disconnected" | "stale";
    type SortKey =
        | "lastUpdateDesc"
        | "usernameAsc"
        | "usernameDesc"
        | "uptimeDesc"
        | "dailyPctDesc"
        | "monthlyPctDesc";

    // View state persistence disabled (no localStorage)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [fupOnly, setFupOnly] = useState<boolean>(false);
    const [sortKey, setSortKey] = useState<SortKey>("lastUpdateDesc");

    const clearFilters = useCallback(() => {
        setStatusFilter("all");
        setFupOnly(false);
        // keep sortKey as-is; sorting doesn’t hide rows
    }, [setStatusFilter, setFupOnly]);

    // Update count when users change
    useEffect(() => {
        onCountChange?.(data?.totalUsers || 0);
    }, [data?.totalUsers, onCountChange]);

    // Search/refresh are controlled by the page component.

    const rows = data?.data ?? [];
    const statusCounts = useMemo(() => {
        return rows.reduce(
            (acc, u) => {
                const status = String(u.session_status || "").toLowerCase();
                if (status === "active") acc.active += 1;
                else if (status === "idle") acc.idle += 1;
                else if (status === "disconnected") acc.disconnected += 1;
                if (isSessionStale(u.session_last_update)) acc.stale += 1;
                return acc;
            },
            { active: 0, idle: 0, disconnected: 0, stale: 0 }
        );
    }, [rows]);

    const displayRows = useMemo(() => {
        let out = rows;
        if (statusFilter !== "all") {
            if (statusFilter === "stale") {
                out = out.filter((u) => isSessionStale(u.session_last_update));
            } else {
                out = out.filter((u) => String(u.session_status || "").toLowerCase() === statusFilter);
            }
        }
        if (fupOnly) {
            out = out.filter((u) => isFupUser(u));
        }

        const num = (s: any) => {
            const n = typeof s === "number" ? s : parseInt(String(s ?? "0"), 10);
            return Number.isFinite(n) ? n : 0;
        };
        const pctOf = (used: any, total: any) => {
            const t = num(total);
            if (t <= 0) return 0;
            return (num(used) / t) * 100;
        };
        const lastUpdateMs = (u: OnlineUser) => {
            const t = u.session_last_update ? Date.parse(u.session_last_update) : NaN;
            return Number.isFinite(t) ? t : 0;
        };

        const sorted = [...out].sort((a, b) => {
            if (sortKey === "usernameAsc") return String(a.session_username).localeCompare(String(b.session_username));
            if (sortKey === "usernameDesc") return String(b.session_username).localeCompare(String(a.session_username));
            if (sortKey === "uptimeDesc") return num(b.session_session_time) - num(a.session_session_time);
            if (sortKey === "dailyPctDesc") return pctOf(b.real_time_data_usage, b.profile_daily_quota) - pctOf(a.real_time_data_usage, a.profile_daily_quota);
            if (sortKey === "monthlyPctDesc") return pctOf(b.monthly_usage, b.profile_monthly_quota) - pctOf(a.monthly_usage, a.profile_monthly_quota);
            // lastUpdateDesc default
            return lastUpdateMs(b) - lastUpdateMs(a);
        });

        return sorted;
    }, [rows, statusFilter, fupOnly, sortKey]);

    const hasClientFilters = fupOnly || statusFilter !== "all" || Boolean(String(search ?? "").trim());
    const isTrulyEmpty = rows.length === 0 && !hasClientFilters;
    const isNoMatches = rows.length > 0 && displayRows.length === 0;

    return (
        <>
            {isRefreshing ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : null}

            <Sheet open={Boolean(detailUsername)} onOpenChange={(open) => (!open ? setDetailUsername(null) : null)}>
                <SheetContent className="sm:max-w-[520px]">
                    <SheetHeader>
                        <SheetTitle>Session Details</SheetTitle>
                        <SheetDescription>
                            {detailUsername ? (
                                <span>
                                    User:{" "}
                                    <Link className="underline" to={`/users/${encodeURIComponent(detailUsername)}`}>
                                        {detailUsername}
                                    </Link>
                                </span>
                            ) : null}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="px-4 pb-4 space-y-4 overflow-auto">
                        {sessionDetailQuery.isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading session detail…</div>
                        ) : sessionDetailQuery.error ? (
                            <div className="text-sm text-red-600">Failed to load session detail.</div>
                        ) : !sessionDetailQuery.data ? (
                            <div className="text-sm text-muted-foreground">No live session found.</div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Status</span><span className="font-medium">{sessionDetailQuery.data.status ?? "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Profile</span><span className="font-medium">{sessionDetailQuery.data.profileName ?? "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">NAS IP</span><span className="font-mono text-xs">{sessionDetailQuery.data.nasIpAddress ?? "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Framed IP</span><span className="font-mono text-xs">{sessionDetailQuery.data.framedIpAddress ?? "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Calling Station</span><span className="font-mono text-xs">{sessionDetailQuery.data.callingStationId ?? "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Acct Session Id</span><span className="font-mono text-xs">{sessionDetailQuery.data.sessionId ?? "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Start</span><span className="font-mono text-xs">{sessionDetailQuery.data.acctStartTime ? new Date(sessionDetailQuery.data.acctStartTime).toLocaleString() : "—"}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Last Update</span><span className="font-mono text-xs">{sessionDetailQuery.data.acctUpdateTime ? new Date(sessionDetailQuery.data.acctUpdateTime).toLocaleString() : "—"}</span></div>
                            </div>
                        )}

                        <div className="border rounded-md">
                            <div className="px-3 py-2 border-b text-sm font-medium">Recent rejects</div>
                            <div className="p-3">
                                {sessionRejectsQuery.isLoading ? (
                                    <div className="text-sm text-muted-foreground">Loading rejects…</div>
                                ) : sessionRejectsQuery.error ? (
                                    <div className="text-sm text-red-600">Failed to load rejects.</div>
                                ) : (Array.isArray(sessionRejectsQuery.data) ? sessionRejectsQuery.data.length : 0) === 0 ? (
                                    <div className="text-sm text-muted-foreground">No recent rejects recorded.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {(sessionRejectsQuery.data as any[]).slice(0, 8).map((r, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                                <span className="font-mono">{r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}</span>
                                                <span className="text-muted-foreground">{r.status ?? "rejected"}</span>
                                                <span className="font-mono">{r.nasIp ?? "—"}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ActionConfirmDialog
                open={Boolean(confirm)}
                onOpenChange={(open) => {
                    if (!open) setConfirm(null);
                }}
                title={
                    confirm?.action === "disconnect"
                        ? "Disconnect session?"
                        : confirm?.action === "reset-mac"
                          ? "Reset MAC address?"
                          : confirm?.action === "reset-monthly"
                            ? "Reset monthly traffic?"
                            : "Reset daily quota?"
                }
                description={
                    confirm?.action === "disconnect"
                        ? `This will send a CoA disconnect for ${confirm?.username}.`
                        : confirm?.action === "reset-mac"
                          ? `This will clear the stored MAC binding for ${confirm?.username}.`
                          : confirm?.action === "reset-monthly"
                            ? `This will reset the monthly traffic counters for ${confirm?.username}.`
                            : `This will reset the daily quota counters for ${confirm?.username}.`
                }
                confirmText={confirm?.action === "disconnect" ? "Disconnect" : "Confirm"}
                confirmTone={confirm?.action === "disconnect" ? "destructive" : "default"}
                onConfirm={async () => {
                    if (!confirm) return;
                    const username = confirm.username;

                    try {
                        if (confirm.action === "reset-quota") {
                            await resetDailyUserQuotaMutation.mutateAsync({ username });
                            await refetch();
                            return;
                        }

                        if (confirm.action === "reset-monthly") {
                            await resetMonthlyUserQuotaMutation.mutateAsync({ username });
                            await refetch();
                            return;
                        }

                        if (confirm.action === "reset-mac") {
                            await resetMacAddressMutation.mutateAsync({ username });
                            await refetch();
                            return;
                        }

                        if (confirm.action === "disconnect") {
                            await disconnectUserSessionMutation.mutateAsync({ username });
                            await refetch();
                        }
                    } finally {
                        // Ensure the dialog closes even if refetch/mutations hang or throw.
                        setConfirm(null);
                    }
                }}
            />

        <QueryState
            isLoading={isLoading}
            error={error}
            // IMPORTANT: don't treat "filtered to 0" as a hard empty state,
            // otherwise the toolbar (and FUP toggle) disappears and user can't undo.
            isEmpty={isTrulyEmpty}
            onRetry={() => refetch()}
            loading={
                <div className="flex justify-center py-20">
                    <Loader />
                </div>
            }
            empty={
                <EmptyState
                    title="No live sessions"
                    description="Try adjusting your search or filters."
                />
            }
            errorTitle="Failed to load live sessions"
        >
            <TableToolbar
                label={`${displayRows.length} of ${data?.totalUsers ?? 0} sessions`}
                className="mb-2 rounded-md border"
                right={
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <FilterPills
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v as StatusFilter)}
                                options={[
                                    { value: "all", label: `All (${rows.length})` },
                                    { value: "active", label: `Active (${statusCounts.active})` },
                                    { value: "idle", label: `Idle (${statusCounts.idle})` },
                                    { value: "disconnected", label: `Disconnected (${statusCounts.disconnected})` },
                                    { value: "stale", label: `Stale (${statusCounts.stale})` },
                                ]}
                                name="online-users-status-filter"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Sort</Label>
                            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                                <SelectTrigger className="h-8 w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lastUpdateDesc">Last update (newest)</SelectItem>
                                    <SelectItem value="uptimeDesc">Uptime (highest)</SelectItem>
                                    <SelectItem value="dailyPctDesc">Daily usage % (highest)</SelectItem>
                                    <SelectItem value="monthlyPctDesc">Monthly usage % (highest)</SelectItem>
                                    <SelectItem value="usernameAsc">Username (A→Z)</SelectItem>
                                    <SelectItem value="usernameDesc">Username (Z→A)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground">FUP only</Label>
                                            <Switch checked={fupOnly} onCheckedChange={setFupOnly} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Show only users currently in fallback/FUP.</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                }
            />

            {isNoMatches ? (
                <EmptyState
                    title="No matches"
                    description="No sessions match the current filters (e.g. FUP only)."
                    actionLabel="Clear filters"
                    onAction={clearFilters}
                    className="mb-4"
                />
            ) : null}

            {/* Desktop */}
            <div className="hidden md:block">
                <DesktopTable
                    users={displayRows}
                    onAction={onAction}
                    canManageRadiusUsers={canManageRadiusUsers}
                    canResetDailyQuota={canResetDailyQuota}
                    canResetMonthlyQuota={canResetMonthlyQuota}
                    canDisconnect={canDisconnect}
                    manageReason={manageReason}
                    disconnectReason={disconnectReason}
                />
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4">
                {displayRows.map((u) => (
                    <MobileCard
                        key={u.session_username}
                        user={u}
                        onAction={onAction}
                        canManageRadiusUsers={canManageRadiusUsers}
                        canResetDailyQuota={canResetDailyQuota}
                        canResetMonthlyQuota={canResetMonthlyQuota}
                        canDisconnect={canDisconnect}
                        manageReason={manageReason}
                        disconnectReason={disconnectReason}
                    />
                ))}
            </div>

            <TablePager
                currentPage={page}
                totalPages={data?.totalPages ?? 1}
                totalItems={data?.totalUsers ?? 0}
                pageSize={limit}
                pageSizeOptions={pageSizes}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
                isDisabled={Boolean(isLoading)}
                noun="users"
            />
        </QueryState>
        </>
    );
};

export default OnlineUsersTable;
