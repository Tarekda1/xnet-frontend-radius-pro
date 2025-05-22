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

import {
    Clock,
    ChevronDown,
    Power,
    RefreshCw,
    RotateCw,
    Settings,
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
    active:
        "bg-green-500 after:bg-blue-500 [--status-color:34,197,94]",
    idle: "bg-yellow-500 after:bg-yellow-500 [--status-color:234,179,8]",
    disconnected:
        "bg-red-500 after:bg-red-500 [--status-color:239,68,68]",
}[s.toLowerCase()] ||
    "bg-gray-500 after:bg-gray-500 [--status-color:107,114,128]");
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
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                Premium
            </Badge>
        );
    if (l === "basic")
        return (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Basic
            </Badge>
        );
    if (l === "basicfn")
        return (
            <Badge variant="outline" className="bg-blue-100 text-purple-800">
                BasicFN
            </Badge>
        );
    return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {p}
        </Badge>
    );
};

/* small reusable bar */
const UsageBar: React.FC<{ used: string; total: string }> = ({
    used,
    total,
}) => {
    const value = pct(used, total);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <div className="text-sm mb-1">
                            {formatBytes(used)} / {formatBytes(total)} ({value.toFixed(1)}%)
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
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {formatBytes(used)} / {formatBytes(total)}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MOBILE CARD ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const MobileCard: React.FC<{
    user: OnlineUser;
    onAction: (a: string, u: string) => void;
}> = React.memo(({ user, onAction }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span className={cn(profileClass(user.profile_profile_name))}>
                    {user.session_username}
                </span>
                {profileBadge(user.profile_profile_name)}
            </CardTitle>
            <CardDescription>{user.userDetails_full_name || "—"}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <p>
                <span className="font-semibold">Status:</span>{" "}
                <Badge variant="outline">
                    <span
                        className={cn(
                            "inline-block w-2 h-2 rounded-full mr-2",
                            statusColor(user.session_status)
                        )}
                    />
                    {formatStatus(user.session_status)}
                </Badge>
            </p>
            <p>
                <span className="font-semibold">Uptime:</span>{" "}
                {formatUptime(user.session_session_time)}
            </p>
            <UsageBar
                used={user.real_time_data_usage}
                total={user.profile_daily_quota}
            />
            <UsageBar
                used={user.monthly_usage}
                total={user.profile_monthly_quota}
            />
        </CardContent>
        <CardFooter className="justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                        Actions <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                <TableRow key={u.session_username} className="hover:bg-gray-50">
                    <TableCell className={cn(profileClass(u.profile_profile_name),`p-4`)}>
                        {u.session_username}
                    </TableCell>
                    <TableCell className="font-bold">{u.userDetails_full_name}</TableCell>
                    <TableCell>{u.session_mac_address}</TableCell>
                    <TableCell>{profileBadge(u.profile_profile_name)}</TableCell>
                    <TableCell>
                        <Badge variant="outline">
                            <span
                                className={cn(
                                    "inline-block w-2 h-2 rounded-full mr-2",
                                    statusColor(u.session_status)
                                )}
                            />
                            {formatStatus(u.session_status)}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {u.is_fallback ? (
                            <span className="text-red-600">Yes</span>
                        ) : (
                            <span className="text-green-600">No</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatUptime(u.session_session_time)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <UsageBar
                            used={u.real_time_data_usage}
                            total={u.profile_daily_quota}
                        />
                    </TableCell>
                    <TableCell>
                        <UsageBar
                            used={u.monthly_usage}
                            total={u.profile_monthly_quota}
                        />
                    </TableCell>
                    <TableCell className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                    Actions <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
    <Card className="overflow-hidden shadow-lg">
        <Table className="dark:bg-gray-600 table-fixed">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-1/10">Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[150px]">MAC</TableHead>
                    <TableHead className="w-[100px]">Profile</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[60px]">FUP</TableHead>
                    <TableHead className="w-[120px]">Uptime</TableHead>
                    <TableHead>Daily</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
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
}

const OnlineUsersTable: React.FC<Props> = ({ search }) => {
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
