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
import { notify } from "@/lib/notify";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";

function readNasConfig(): { ip: string; code: string; port: number; configured: boolean } {
    // - In dev: provided by Vite via import.meta.env.VITE_*
    // - In prod Docker: provided at runtime via /env.js (window.__ENV__)
    const runtimeEnv = (window as any).__ENV__ || {};
    const ip = String(runtimeEnv.DEFAULT_NAS_IP ?? import.meta.env.VITE_DEFAULT_NAS_IP ?? "").trim();
    const code = String(runtimeEnv.DEFAULT_NAS_SECRET ?? import.meta.env.VITE_DEFAULT_NAS_SECRET ?? "").trim();
    const port = Number(runtimeEnv.DEFAULT_NAS_COA_PORT ?? import.meta.env.VITE_DEFAULT_NAS_COA_PORT ?? 1700);
    return { ip, code, port, configured: Boolean(ip) && Boolean(code) };
}

/* ───────── helpers (same logic you used before) */
const formatBytes = (b: string) => {
    const n = parseInt(b, 10);
    if (!n) return "0 Bytes";
    const k = 1024,
        units = ["Bytes", "KB", "MB", "GB", "TB"],
        i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / k ** i).toFixed(2)} ${units[i]}`;
};
const pct = (u: string, t: string) =>
    Math.min((parseInt(u, 10) / parseInt(t, 10)) * 100, 100);
const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400),
        h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60),
        sec = s % 60;
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, sec && `${sec}s`]
        .filter(Boolean)
        .join(" ");
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

/* small reusable bar */
const UsageBar: React.FC<{ used: string; total: string; type: 'daily' | 'monthly' }> = ({
    used,
    total,
    type
}) => {
    const value = pct(used, total);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="space-y-1.5">
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
                                value > 90
                                    ? "bg-red-200"
                                    : value > 75
                                        ? "bg-yellow-200"
                                        : "bg-gray-200"
                            )}
                        />
                        <div className="text-xs text-muted-foreground text-right">
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
    canDisconnect: boolean;
    manageReason: string;
    disconnectReason: string;
}> = React.memo(({ user, onAction, canManageRadiusUsers, canDisconnect, manageReason, disconnectReason }) => (
    <Card className="overflow-hidden border border-border/50 hover:border-border transition-colors">
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
                <UsageBar
                    used={user.real_time_data_usage}
                    total={user.profile_daily_quota}
                    type="daily"
                />
            </div>
            <UsageBar
                used={user.monthly_usage}
                total={user.profile_monthly_quota}
                type="monthly"
            />
        </CardContent>
        <CardFooter className="pt-2">
            <div className="flex w-full justify-end">
                <TableRowActions
                    actions={[
                        { label: "Session Details", icon: HardDrive, onClick: () => onAction("details", user.session_username) },
                        { label: "View Traffic", icon: Activity, onClick: () => onAction("view-traffic", user.session_username) },
                        { label: "Disconnect", icon: Power, onClick: () => onAction("disconnect", user.session_username), tone: "destructive" as const, disabled: !canDisconnect || !readNasConfig().configured, disabledReason: !canDisconnect ? disconnectReason : "Configure NAS IP/secret in env to enable disconnect." },
                        { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", user.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                        { label: "Reset Quota", icon: RotateCw, onClick: () => onAction("reset-quota", user.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                        { label: "Change Profile", icon: Settings, onClick: () => onAction("change-profile", user.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                    ]}
                />
            </div>
        </CardFooter>
    </Card>
));

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DESKTOP TABLE ROWS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const TableRows = function TableRows({
    users,
    onAction,
    canManageRadiusUsers,
    canDisconnect,
    manageReason,
    disconnectReason,
}: {
    users: OnlineUser[];
    onAction: (a: string, u: string) => void;
    canManageRadiusUsers: boolean;
    canDisconnect: boolean;
    manageReason: string;
    disconnectReason: string;
}) {
    return (
        <>
            {users.map((u) => (
                <TableRow 
                    key={u.session_username} 
                    className={cn(
                        "hover:bg-muted/50 transition-colors",
                        u.session_status === 'active' && "bg-white/50",
                        u.session_status === 'idle' && "bg-yellow-50/50",
                        u.is_fallback && "bg-purple-50/50 border-l-4 border-l-purple-500"
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
                                u.is_fallback ? "text-purple-600" : "text-green-600"
                            )} />
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-sm",
                                    u.is_fallback 
                                        ? "bg-purple-100 text-purple-700 border-purple-200" 
                                        : "bg-green-100 text-green-700 border-green-200"
                                )}
                            >
                                {u.is_fallback ? "Yes" : "No"}
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
                        <UsageBar
                            used={u.real_time_data_usage}
                            total={u.profile_daily_quota}
                            type="daily"
                        />
                    </TableCell>
                    <TableCell>
                        <UsageBar
                            used={u.monthly_usage}
                            total={u.profile_monthly_quota}
                            type="monthly"
                        />
                    </TableCell>
                    <TableCell className="text-center">
                        <TableRowActions
                            actions={[
                                { label: "Session Details", icon: HardDrive, onClick: () => onAction("details", u.session_username) },
                                { label: "View Traffic", icon: Activity, onClick: () => onAction("view-traffic", u.session_username) },
                                { label: "Disconnect", icon: Power, onClick: () => onAction("disconnect", u.session_username), tone: "destructive" as const, disabled: !canDisconnect || !readNasConfig().configured, disabledReason: !canDisconnect ? disconnectReason : "Configure NAS IP/secret in env to enable disconnect." },
                                { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", u.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                                { label: "Reset Quota", icon: RotateCw, onClick: () => onAction("reset-quota", u.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                                { label: "Change Profile", icon: Settings, onClick: () => onAction("change-profile", u.session_username), disabled: !canManageRadiusUsers, disabledReason: manageReason },
                            ]}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DESKTOP TABLE WRAPPER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const DesktopTable: React.FC<{
    users: OnlineUser[];
    onAction: (a: string, u: string) => void;
    canManageRadiusUsers: boolean;
    canDisconnect: boolean;
    manageReason: string;
    disconnectReason: string;
}> = React.memo(({ users, onAction, canManageRadiusUsers, canDisconnect, manageReason, disconnectReason }) => (
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
        resetMacAddressMutation,
        disconnectUserSessionMutation,
    } = useOnlineUsers(search, 1, 100);
    //search,

    const [confirm, setConfirm] = useState<null | { action: "reset-quota" | "reset-mac" | "disconnect"; username: string }>(null);
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
        [resetDailyUserQuotaMutation, resetMacAddressMutation, disconnectUserSessionMutation, refetch, onChangeProfile, onViewTraffic]
    );

    // Allow parent to trigger a refetch (e.g., top Refresh button)
    useEffect(() => {
        if (!refreshToken) return;
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshToken]);

    useEffect(() => {
        console.log("page", page);
        console.log("limit", limit);
    }, [page, limit]);

    /* page-size select options */
    const pageSizes = useMemo(() => [10, 25, 50, 100], []);

    // Update count when users change
    useEffect(() => {
        onCountChange?.(data?.totalUsers || 0);
    }, [data?.totalUsers, onCountChange]);

    // Search/refresh are controlled by the page component.

    if (isRefreshing) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    const rows = data?.data ?? [];

    return (
        <>
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
                          : "Reset daily quota?"
                }
                description={
                    confirm?.action === "disconnect"
                        ? `This will send a CoA disconnect for ${confirm?.username}.`
                        : confirm?.action === "reset-mac"
                          ? `This will clear the stored MAC binding for ${confirm?.username}.`
                          : `This will reset the daily quota counters for ${confirm?.username}.`
                }
                confirmText={confirm?.action === "disconnect" ? "Disconnect" : "Confirm"}
                confirmTone={confirm?.action === "disconnect" ? "destructive" : "default"}
                onConfirm={async () => {
                    if (!confirm) return;
                    const username = confirm.username;

                    if (confirm.action === "reset-quota") {
                        await resetDailyUserQuotaMutation.mutateAsync({ username });
                        await refetch();
                        return;
                    }

                    if (confirm.action === "reset-mac") {
                        await resetMacAddressMutation.mutateAsync({ username });
                        await refetch();
                        return;
                    }

                    if (confirm.action === "disconnect") {
                        const nas = readNasConfig();
                        if (!nas.configured) {
                            notify.error("Missing NAS config", "Set DEFAULT_NAS_IP/DEFAULT_NAS_SECRET (prod) or VITE_DEFAULT_NAS_* (dev).");
                            return;
                        }

                        await disconnectUserSessionMutation.mutateAsync({ username, ip: nas.ip, code: nas.code, port: nas.port });
                        await refetch();
                    }
                }}
            />

        <QueryState
            isLoading={isLoading}
            error={error}
            isEmpty={rows.length === 0}
            onRetry={() => refetch()}
            loading={
                <div className="flex justify-center py-20">
                    <Loader />
                </div>
            }
            empty={
                <EmptyState
                    title="No live sessions"
                    description="Try adjusting your search."
                />
            }
            errorTitle="Failed to load live sessions"
        >
            <TableToolbar label={`${data?.totalUsers ?? 0} sessions`} className="mb-2 rounded-md border" />

            {/* Desktop */}
            <div className="hidden md:block">
                <DesktopTable
                    users={rows}
                    onAction={onAction}
                    canManageRadiusUsers={canManageRadiusUsers}
                    canDisconnect={canDisconnect}
                    manageReason={manageReason}
                    disconnectReason={disconnectReason}
                />
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4">
                {rows.map((u) => (
                    <MobileCard
                        key={u.session_username}
                        user={u}
                        onAction={onAction}
                        canManageRadiusUsers={canManageRadiusUsers}
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
