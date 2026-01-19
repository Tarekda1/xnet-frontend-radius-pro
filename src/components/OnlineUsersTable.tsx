// OnlineUsersTable.tsx
import React, {
    useCallback,
    useMemo,
    useEffect,
} from "react";
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

import {
    Clock,
    Power,
    RefreshCw,
    RotateCw,
    Settings,
    User,
    Wifi,
    HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}> = React.memo(({ user, onAction }) => (
    <Card className="overflow-hidden border border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className={cn("text-lg", profileClass(user.profile_profile_name))}>
                        {user.session_username}
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
                        { label: "Disconnect", icon: Power, onClick: () => onAction("disconnect", user.session_username), tone: "destructive" as const },
                        { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", user.session_username) },
                        { label: "Reset Quota", icon: RotateCw, onClick: () => onAction("reset-quota", user.session_username) },
                        { label: "Change Profile", icon: Settings, onClick: () => onAction("change-profile", user.session_username) },
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
}: {
    users: OnlineUser[];
    onAction: (a: string, u: string) => void;
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
                                <div className="font-medium">{u.session_username}</div>
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
                                { label: "Disconnect", icon: Power, onClick: () => onAction("disconnect", u.session_username), tone: "destructive" as const },
                                { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", u.session_username) },
                                { label: "Reset Quota", icon: RotateCw, onClick: () => onAction("reset-quota", u.session_username) },
                                { label: "Change Profile", icon: Settings, onClick: () => onAction("change-profile", u.session_username) },
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
}> = React.memo(({ users, onAction }) => (
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
                <TableRows users={users} onAction={onAction} />
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
    // onSearch/onRefresh are handled by the parent page
}

const OnlineUsersTable: React.FC<Props> = ({ 
    search, 
    onCountChange, 
    isRefreshing,
}) => {
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
    const onAction = useCallback(
        (action: string, username: string) => {
            if (action === "reset-quota") {
                resetDailyUserQuotaMutation.mutate(
                    { username },
                    { onSuccess: () => refetch(), onError: (e) => alert(e.message) }
                );
                return;
            }

            if (action === "reset-mac") {
                resetMacAddressMutation.mutate(
                    { username },
                    { onSuccess: () => refetch(), onError: (e) => alert(e.message) }
                );
                return;
            }

            if (action === "disconnect") {
                // Choose NAS IP/secret.
                // - In dev: provided by Vite via import.meta.env.VITE_*
                // - In prod Docker: provided at runtime via /env.js (window.__ENV__)
                const runtimeEnv = (window as any).__ENV__ || {};
                const ip = String(runtimeEnv.DEFAULT_NAS_IP ?? import.meta.env.VITE_DEFAULT_NAS_IP ?? "").trim();
                const code = String(runtimeEnv.DEFAULT_NAS_SECRET ?? import.meta.env.VITE_DEFAULT_NAS_SECRET ?? "").trim();
                const port = Number(runtimeEnv.DEFAULT_NAS_COA_PORT ?? import.meta.env.VITE_DEFAULT_NAS_COA_PORT ?? 1700);

                if (!ip || !code) {
                    alert("NAS IP/secret not configured");
                    return;
                }

                disconnectUserSessionMutation.mutate(
                    { username, ip, code, port },
                    { onSuccess: () => refetch(), onError: (e) => alert(e.message) }
                );
                return;
            }

            if (action === "change-profile") {
                // TODO: implement change profile flow (modal + API) if needed.
                alert("Change profile: not implemented yet.");
                return;
            }
        },
        [resetDailyUserQuotaMutation, resetMacAddressMutation, disconnectUserSessionMutation, refetch]
    );

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
                    title="No online users"
                    description="Try adjusting your search."
                />
            }
            errorTitle="Failed to load online users"
        >
            <TableToolbar label={`${data?.totalUsers ?? 0} sessions`} className="mb-2 rounded-md border" />

            {/* Desktop */}
            <div className="hidden md:block">
                <DesktopTable users={rows} onAction={onAction} />
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4">
                {rows.map((u) => (
                    <MobileCard key={u.session_username} user={u} onAction={onAction} />
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
    );
};

export default OnlineUsersTable;
