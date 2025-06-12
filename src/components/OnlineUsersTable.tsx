// OnlineUsersTable.tsx
import React, {
    useState,
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
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import SearchBar from "@/components/SearchBar";

import {
    Clock,
    ChevronDown,
    Power,
    RefreshCw,
    RotateCw,
    Settings,
    User,
    Wifi,
    HardDrive,
    Users,
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
const statusColor = (s: string) =>
({
    active: "bg-blue-500 after:bg-blue-500 [--status-color:59,130,246]",
    idle: "bg-yellow-500 after:bg-yellow-500 [--status-color:234,179,8]",
    disconnected: "bg-red-500 after:bg-red-500 [--status-color:239,68,68]",
}[s.toLowerCase()] || "bg-gray-500 after:bg-gray-500 [--status-color:107,114,128]");
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
    const isActive = status.toLowerCase() === 'active';
    const isIdle = status.toLowerCase() === 'idle';
    const isDisconnected = status.toLowerCase() === 'disconnected';

    return (
        <Badge 
            variant="outline" 
            className={cn(
                "relative pl-6 pr-3 py-1.5 border-2",
                isActive && "border-blue-200 bg-blue-50/50 text-blue-700",
                isIdle && "border-yellow-200 bg-yellow-50/50 text-yellow-700",
                isDisconnected && "border-red-200 bg-red-50/50 text-red-700"
            )}
        >
            <span
                className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 inline-block w-2 h-2 rounded-full",
                    statusColor(status),
                    isActive && "animate-pulse"
                )}
            />
            {formatStatus(status)}
        </Badge>
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full">
                        Actions <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => onAction("disconnect", user.session_username)}
                    >
                        <Power className="h-4 w-4 mr-2" /> Disconnect
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onAction("reset-mac", user.session_username)}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Reset MAC
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onAction("reset-quota", user.session_username)}
                    >
                        <RotateCw className="h-4 w-4 mr-2" /> Reset Quota
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onAction("change-profile", user.session_username)}
                    >
                        <Settings className="h-4 w-4 mr-2" /> Change Profile
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
                        u.session_status === 'active' && "bg-blue-50/50",
                        u.session_status === 'idle' && "bg-yellow-50/50"
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
                            <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={cn(
                                "text-sm",
                                u.is_fallback ? "text-red-600" : "text-green-600"
                            )}>
                                {u.is_fallback ? "Yes" : "No"}
                            </span>
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                    Actions <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => onAction("disconnect", u.session_username)}
                                >
                                    <Power className="h-4 w-4 mr-2" /> Disconnect
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onAction("reset-mac", u.session_username)}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" /> Reset MAC
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onAction("reset-quota", u.session_username)}
                                >
                                    <RotateCw className="h-4 w-4 mr-2" /> Reset Quota
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onAction("change-profile", u.session_username)}
                                >
                                    <Settings className="h-4 w-4 mr-2" /> Change Profile
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
        <Table>
            <TableHeader>
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
    </Card>
));

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MAIN TABLE COMPONENT ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
interface Props {
    search: string;
    onCountChange?: (count: number) => void;
    isRefreshing?: boolean;
    onSearch?: (term: string) => void;
    onRefresh?: () => void;
}

const OnlineUsersTable: React.FC<Props> = ({ 
    search, 
    onCountChange, 
    isRefreshing,
    onSearch,
    onRefresh 
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
    } = useOnlineUsers(search, 1, 100);
    //search,
    const onAction = useCallback(
        (action: string, username: string) => {
            if (action === "reset-quota") {
                resetDailyUserQuotaMutation.mutate(
                    { username },
                    { onSuccess: () => refetch(), onError: (e) => alert(e.message) }
                );
            }
            // TODO other server actions
        },
        [resetDailyUserQuotaMutation, refetch]
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

    const handleSearch = useCallback((term: string) => {
        onSearch?.(term);
    }, [onSearch]);

    const handleRefresh = useCallback(() => {
        onRefresh?.();
        refetch();
    }, [onRefresh, refetch]);

    if (isRefreshing) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    if (isLoading)
        return (
            <div className="flex justify-center py-20">
                <Loader />
            </div>
        );
    if (error)
        return <p className="text-center text-red-500">{error.message}</p>;

    return (
        <>

            {/* Desktop */}
            <div className="hidden md:block">
                <DesktopTable users={data!.data} onAction={onAction} />
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4">
                {data!.data.map((u) => (
                    <MobileCard key={u.session_username} user={u} onAction={onAction} />
                ))}
            </div>

            {/* footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4">
                <p className="text-sm">
                    Showing {data!.data.length} of {data!.totalUsers} users
                </p>
                <div className="flex items-center gap-2">
                    <Label htmlFor="size">Show:</Label>
                    <Select value={String(limit)} onValueChange={(v) => setLimit(+v)}>
                        <SelectTrigger id="size" className="h-8 w-28 px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizes.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} rows
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 pb-4">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        disabled={page === data!.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </>
    );
};

export default OnlineUsersTable;
