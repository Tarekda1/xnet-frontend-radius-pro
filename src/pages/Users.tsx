import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    TrendingUp,
    TrendingDown,
    Trash2
} from 'lucide-react';
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
import { Progress } from "@/components/ui/progress";
import { 
    PieChart as RechartsPieChart, 
    Pie, 
    Cell,
    Tooltip as RechartsTooltip, 
    ResponsiveContainer 
} from 'recharts';
import { notify } from "@/lib/notify";
import { MESSAGES } from "@/constants/messages";
import QueryState from "@/components/QueryState";
import ActionConfirmDialog from "@/components/ActionConfirmDialog";
import { useProfiles } from "@/hooks/useProfiles";
import { apiClient } from "@/api/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadTextFile, parseCsv, toCsv } from "@/lib/csv";
import { useAuth } from "@/context/AuthContext";
import { canAny } from "@/lib/permissions";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";

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

const MetricItem = ({ 
    label, 
    value, 
    icon: Icon, 
    color, 
    onClick, 
    showDot = false,
    tooltipText,
    trend,
    trendValue,
    subtitle,
    gradient = false,
    iconOnly = false
}: { 
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    onClick?: () => void;
    showDot?: boolean;
    tooltipText: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    subtitle?: string;
    gradient?: boolean;
    iconOnly?: boolean;
}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div 
                    className={`relative group transition-all duration-300 ${
                        onClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={onClick}
                >
                    <div className={`
                        relative ${iconOnly ? 'p-2' : 'p-2 sm:p-3'} rounded-xl border transition-all duration-300
                        ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50' : 'bg-white/80 backdrop-blur-sm'}
                        ${onClick ? 'hover:shadow-lg hover:scale-105 hover:border-primary/20' : ''}
                        ${gradient ? 'shadow-sm' : 'shadow-md'}
                        border-gray-200/60
                    `}>
                        {/* Animated background gradient */}
                        {gradient && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                {!iconOnly && (
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
                                )}
                                <div className="relative">
                                    <Icon className={`h-4 w-4 ${color} transition-transform duration-300 group-hover:scale-110`} />
                                    {showDot && (
                                        <span className={`absolute -top-1 -right-1 h-2 w-2 ${color.replace('text', 'bg')} rounded-full animate-pulse`} />
                                    )}
                                </div>
                            </div>
                            
                            {!iconOnly && (
                                <div className="flex items-end justify-between">
                                    <span className={`text-lg sm:text-xl font-bold ${color} transition-colors duration-300`}>
                                        {value.toLocaleString()}
                                    </span>
                                    {trend && (
                                        <div className="flex items-center gap-1">
                                            {trend === 'up' ? (
                                                <TrendingUp className="h-3 w-3 text-emerald-500 animate-bounce" />
                                            ) : trend === 'down' ? (
                                                <TrendingDown className="h-3 w-3 text-red-500 animate-bounce" />
                                            ) : null}
                                            {trendValue && (
                                                <span className={`text-xs font-medium ${
                                                    trend === 'up' ? 'text-emerald-600' : 
                                                    trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                    {trendValue}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {subtitle && !iconOnly && (
                                <span className="text-xs text-gray-500 mt-1 block">{subtitle}</span>
                            )}
                        </div>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const UsageChart = ({ users }: { users: User[] }) => {
    const chartData = useMemo(() => {
        const profileStats = users.reduce((acc, user) => {
            const profileName = user.profile.profileName;
            acc[profileName] = (acc[profileName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(profileStats).map(([name, value]) => ({
            name,
            value,
            fill: name === 'Premium' ? '#fbbf24' : name === 'Basic' ? '#3b82f6' : '#10b981'
        }));
    }, [users]);

    return (
        <div className="h-64 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-lg" />
            <div className="relative z-10 h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(75, 85, 99, 0.5)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

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
                    className="group relative p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-blue-200/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 truncate">
                                {e.title}
                            </p>
                            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300 truncate">
                                Actor: {e.actor}
                                {e.primaryTarget ? ` • Target: ${String(e.primaryTarget)}` : ""}
                                {e.detail ? ` • ${e.detail}` : ""}
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300 font-mono whitespace-nowrap">
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
}: { 
    selectedUsers: Set<number>;
    onBulkAction: (action: string) => void;
    onSelectAll: (selected: boolean) => void;
    allUsers: User[];
    profiles: { id?: number; profileName: string }[];
}) => {
    const isAllSelected = selectedUsers.size === allUsers.length;
    const [profileId, setProfileId] = useState<string>("");
    const { user: authUser } = useAuth();
    const canManageUsers = useMemo(() => canAny(authUser, ["users.view", "reseller.users.manage"]), [authUser]);
    const manageUsersReason = "You don't have permission to manage users.";

    return (
        <div className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 p-4 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-pink-100/20 animate-pulse" />
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onSelectAll}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label className="text-sm font-semibold text-gray-700">
                        {selectedUsers.size} of {allUsers.length} selected
                    </Label>
                </div>
                
                {selectedUsers.size > 0 && (
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:ml-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('suspend')}
                            disabled={!canManageUsers}
                            title={!canManageUsers ? manageUsersReason : "Suspend selected users"}
                            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all duration-300 hover:scale-105"
                        >
                            <UserX className="h-4 w-4 mr-1" />
                            Suspend
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('activate')}
                            disabled={!canManageUsers}
                            title={!canManageUsers ? manageUsersReason : "Activate selected users"}
                            className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:scale-105"
                        >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('export')}
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('reset-mac')}
                            disabled={!canManageUsers}
                            title={!canManageUsers ? manageUsersReason : "Reset MAC for selected users"}
                            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all duration-300 hover:scale-105"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reset MAC
                        </Button>

                        <div className="flex items-center gap-2 ml-2">
                            <Select value={profileId} onValueChange={setProfileId}>
                                <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white/80">
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
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!profileId || !canManageUsers}
                                onClick={() => onBulkAction(`assign-profile:${profileId}`)}
                                title={!canManageUsers ? manageUsersReason : !profileId ? "Select a profile first" : "Assign profile"}
                                className="bg-white/80 border-gray-200 text-gray-800 hover:bg-white transition-all duration-300 hover:scale-105"
                            >
                                Assign
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('delete')}
                            disabled={!canManageUsers}
                            title={!canManageUsers ? manageUsersReason : "Delete selected users"}
                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-300 hover:scale-105"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const UsersPage: React.FC = () => {
    const { user: authUser } = useAuth();
    const canSeeAudit = useMemo(() => canAny(authUser, ["users.view", "reseller.users.view"]), [authUser]);
    const canSeeLiveSessions = useMemo(
        () => canAny(authUser, ["users.online.view", "reseller.users.view"]),
        [authUser]
    );
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [pageSize, setPageSize] = useState(50);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'analytics'>('table');
    const [advancedFilters, setAdvancedFilters] = useState({
        profile: 'all',
        quotaExceeded: false,
        hasMacAddress: false,
        hasContactInfo: false
    });
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
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFileName, setImportFileName] = useState<string>("");
    const [importRows, setImportRows] = useState<Array<{ raw: Record<string, string>; errors: string[] }>>([]);
    const [isImporting, setIsImporting] = useState(false);

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
    const [confirmAction, setConfirmAction] = useState<
        | null
        | { kind: 'delete-user'; username: string }
        | { kind: 'reset-mac'; username: string }
        | { kind: 'reset-quota'; username: string }
        | { kind: 'reset-monthly-quota'; username: string }
        | { kind: 'bulk'; action: 'suspend' | 'activate' | 'delete' | 'reset-mac' | 'assign-profile'; usernames: string[]; profileId?: number; profileName?: string }
    >(null);

    // Enhanced filtering with advanced filters
    const filteredUsers = React.useMemo(() => {
        let filtered = serverUsers;

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(user => {
                switch (statusFilter) {
                    case 'active':
                        return user.accountStatus === 'active';
                    case 'suspended':
                        return user.accountStatus === 'suspended';
                    case 'online':
                        return user.isOnline === true;
                    case 'offline':
                        return user.isOnline === false;
                    case 'profile:premium':
                        return user.profile.profileName.toLowerCase() === 'premium';
                    case 'profile:basic':
                        return user.profile.profileName.toLowerCase() === 'basic';
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
            // Calculate trends (simulated)
            onlineTrend,
            onlineTrendValue: `${Math.round((online / allUsers.length) * 100)}%`,
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

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        refetch().finally(() => {
            setTimeout(() => {
                setIsRefreshing(false);
                notify.success(MESSAGES.users.refreshedTitle, MESSAGES.users.refreshedDescription);
            }, 1000);
        });
    }, [refetch]);

    const handleAddUser = useCallback(() => {
        setEditingUser(null);
        setIsAddUserModalOpen(true);
    }, []);

    const handleUserAdded = useCallback(() => {
        refetch();
        setIsAddUserModalOpen(false);
        setEditingUser(null);
    }, [refetch]);

    const handleCloseModal = useCallback(() => {
        setIsAddUserModalOpen(false);
        setEditingUser(null);
    }, []);

    const handleQuickFilter = useCallback((filter: string) => {
        switch (filter) {
            case 'all':
                setStatusFilter('');
                break;
            case 'suspended':
                setStatusFilter('suspended');
                break;
            case 'online':
                setStatusFilter('online');
                break;
            case 'offline':
                setStatusFilter('offline');
                break;
            default:
                setStatusFilter('');
        }
    }, []);

    const handleAction = useCallback((action: string, user: User) => {
        const actions = {
            edit: () => {
                setEditingUser(user);
                setIsAddUserModalOpen(true);
            },
            delete: () => setConfirmAction({ kind: 'delete-user', username: user.username }),
            'reset-mac': () => setConfirmAction({ kind: 'reset-mac', username: user.username }),
            // Not wired in Users module yet (Live Sessions has it); keep consistent UX.
            'reset-quota': () => setConfirmAction({ kind: 'reset-quota', username: user.username }),
            'reset-monthly': () => setConfirmAction({ kind: 'reset-monthly-quota', username: user.username }),
        };

        const actionFunction = actions[action as keyof typeof actions];
        if (actionFunction) {
            actionFunction();
        } else {
            console.warn('Unknown action:', action);
        }
    }, [deleteUserMutation, resetMacAddressMutation]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing page size
    }, [setCurrentPage]);

    const handleExportUsers = useCallback(() => {
        // Export the current filtered view (CSV)
        const exportableUsers = filteredUsers;
        if (!exportableUsers.length) {
            notify.error(MESSAGES.users.exportEmptyTitle, MESSAGES.users.exportEmptyDescription);
            return;
        }

        const rows = exportableUsers.map((u) => ({
            username: u.username ?? "",
            fullName: u.userDetails?.fullName ?? "",
            phoneNumber: u.userDetails?.phoneNumber ?? "",
            email: u.userDetails?.email ?? "",
            profile: u.profile?.profileName ?? "",
            accountStatus: u.accountStatus ?? "",
            isOnline: u.isOnline ? "true" : "false",
            macAddress: u.macAddress?.macAddress ?? "",
            lastTimeActive: u.lastTimeActive ?? "",
        }));
        const cols = ["username", "fullName", "phoneNumber", "email", "profile", "accountStatus", "isOnline", "macAddress", "lastTimeActive"];
        const csv = toCsv(rows, cols);

        const date = new Date().toISOString().split('T')[0];
        const filterSuffix = statusFilter ? `_${statusFilter}` : '';
        const filename = `users${filterSuffix}_${date}.csv`;
        downloadTextFile(filename, csv, "text/csv;charset=utf-8");
        notify.success(MESSAGES.users.exportSuccessTitle, `${exportableUsers.length} users exported to ${filename}`);
    }, [filteredUsers, statusFilter]);

    const handleImportFile = useCallback(async (file: File | null) => {
        setImportRows([]);
        setImportFileName(file?.name ?? "");
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

        setImportRows(out);
    }, []);

    const runImport = useCallback(async () => {
        const valid = importRows.filter((r) => r.errors.length === 0).map((r) => r.raw);
        if (!valid.length) {
            notify.error("Import", "No valid rows to import.");
            return;
        }

        setIsImporting(true);
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
            setIsImportOpen(false);
            setImportRows([]);
            setImportFileName("");
        } finally {
            setIsImporting(false);
        }
    }, [importRows, refetch]);

    // New handlers for enhanced features
    const handleSelectAll = useCallback((selected: boolean) => {
        if (selected) {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
        } else {
            setSelectedUsers(new Set());
        }
    }, [filteredUsers]);

    const handleToggleSelected = useCallback((userId: number, selected: boolean) => {
        setSelectedUsers((prev) => {
            const next = new Set(prev);
            if (selected) next.add(userId);
            else next.delete(userId);
            return next;
        });
    }, []);

    const handleBulkAction = useCallback((action: string) => {
        const selectedUserList = filteredUsers.filter(u => selectedUsers.has(u.id));
        const usernames = selectedUserList.map((u) => u.username).filter(Boolean);
        
        switch (action) {
            case 'suspend':
                setConfirmAction({ kind: 'bulk', action: 'suspend', usernames });
                break;
            case 'activate':
                setConfirmAction({ kind: 'bulk', action: 'activate', usernames });
                break;
            case 'export':
                handleExportUsers();
                break;
            case 'reset-mac':
                setConfirmAction({ kind: 'bulk', action: 'reset-mac', usernames });
                break;
            case 'delete':
                setConfirmAction({ kind: 'bulk', action: 'delete', usernames });
                break;
            default: {
                if (action.startsWith('assign-profile:')) {
                    const idStr = action.split(':')[1];
                    const pid = Number(idStr);
                    const p = (profilesQuery.data?.data ?? []).find((x: any) => Number(x.id) === pid);
                    setConfirmAction({ kind: 'bulk', action: 'assign-profile', usernames, profileId: pid, profileName: p?.profileName });
                }
            }
        }
    }, [selectedUsers, filteredUsers, handleExportUsers]);

    return (
        <>
        <ActionConfirmDialog
            open={Boolean(confirmAction)}
            onOpenChange={(open) => {
                if (!open) setConfirmAction(null);
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
                            setSelectedUsers(new Set());
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
                            setSelectedUsers(new Set());
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
                            setSelectedUsers(new Set());
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
                            setSelectedUsers(new Set());
                            notify.success("Bulk action", `${deleted} users deleted.`);
                            return;
                        }
                    } catch (e: any) {
                        notify.error("Bulk action failed", e?.response?.data?.message || e?.message || "Request failed");
                    }
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
                <div className="w-full py-6 space-y-6">
                    <PageHeader
                        title="Users Management"
                        subtitle="Comprehensive user management and monitoring system"
                        icon={UsersIcon}
                        rightContent={<Skeleton className="h-10 w-full md:w-[260px]" />}
                        actions={
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        }
                    />

                    <Card className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <Skeleton className="h-10 w-full lg:max-w-xl" />
                            <div className="flex items-center gap-4 lg:border-l lg:border-border lg:pl-6">
                                <Skeleton className="h-16 w-32" />
                                <Skeleton className="h-16 w-32" />
                                <Skeleton className="h-16 w-32" />
                            </div>
                        </div>
                    </Card>

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
        <div className="w-full min-w-0 sm:px-0 py-6 space-y-6 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/30 min-h-screen">
            <PageHeader 
                title="Users Management"
                subtitle="Comprehensive user management and monitoring system"
                icon={UsersIcon}
                rightContent={(
                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end">
                        <div className="flex items-center gap-2">
                            <Label className="hidden sm:inline text-sm font-medium">View:</Label>
                            <Select value={viewMode} onValueChange={(value: 'table' | 'cards' | 'analytics') => setViewMode(value)}>
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="table">Table</SelectItem>
                                    <SelectItem value="cards">Cards</SelectItem>
                                    <SelectItem value="analytics">Analytics</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="hidden sm:inline text-sm font-medium">Filter:</Label>
                            <Select
                                value={
                                    statusFilter === "online"
                                        ? "online"
                                        : statusFilter === "offline"
                                          ? "offline"
                                          : statusFilter === "suspended"
                                            ? "suspended"
                                            : "all"
                                }
                                onValueChange={(v) => handleQuickFilter(v)}
                            >
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                actions={(
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="w-full justify-center sm:w-auto">
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button variant="outline" onClick={handleExportUsers} disabled={filteredUsers.length === 0} className="w-full justify-center sm:w-auto">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" onClick={() => setIsImportOpen(true)} disabled={!canManageUsers} title={!canManageUsers ? manageUsersReason : "Import CSV"} className="w-full justify-center sm:w-auto">
                            <Upload className="h-4 w-4 mr-2" />
                            Import CSV
                        </Button>
                        <Button onClick={handleAddUser} disabled={!canManageUsers} title={!canManageUsers ? manageUsersReason : "New User"} className="w-full justify-center sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            New User
                        </Button>
                    </div>
                )}
            />

            {/* Enhanced Dashboard Controls Card */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-pink-50/30" />
                <CardContent className="relative z-10 p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Search + Inline Filters */}
                        <div className="flex-1 min-w-0 lg:max-w-5xl flex flex-col md:flex-row gap-3 items-start md:items-center">
                            <div className="w-full md:min-w-[60%] md:max-w-[60%]">
                                <SearchBar 
                                    currentSearchTerm={searchQuery} 
                                    onSearch={handleSearch}
                                    placeholder="Search by username, status, or profile..."
                                    className="w-full"
                                    autoSearch={false}
                                    showButton
                                />
                            </div>
                            <div className="w-full">
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                                <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Filters</span>
                                </div>
                                <Select 
                                    value={advancedFilters.profile} 
                                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, profile: value }))}
                                >
                                    <SelectTrigger className="col-span-2 w-full sm:w-[140px] bg-white/80 border-gray-200/60">
                                        <SelectValue placeholder="Profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="quotaExceeded"
                                        checked={advancedFilters.quotaExceeded}
                                        onCheckedChange={(checked) => 
                                            setAdvancedFilters(prev => ({ ...prev, quotaExceeded: !!checked }))
                                        }
                                        className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                    />
                                    <Label htmlFor="quotaExceeded" className="text-xs font-medium text-gray-700">Quota</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="hasMacAddress"
                                        checked={advancedFilters.hasMacAddress}
                                        onCheckedChange={(checked) => 
                                            setAdvancedFilters(prev => ({ ...prev, hasMacAddress: !!checked }))
                                        }
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <Label htmlFor="hasMacAddress" className="text-xs font-medium text-gray-700">MAC</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="hasContactInfo"
                                        checked={advancedFilters.hasContactInfo}
                                        onCheckedChange={(checked) => 
                                            setAdvancedFilters(prev => ({ ...prev, hasContactInfo: !!checked }))
                                        }
                                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <Label htmlFor="hasContactInfo" className="text-xs font-medium text-gray-700">Contact</Label>
                                </div>
                            </div>
                            </div>
                        </div>

                        {/* Compact Metrics Section */}
                        <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:flex lg:items-center lg:gap-4 lg:border-l lg:border-gray-200/60 lg:pl-4">
                            <MetricItem
                                label="Total"
                                value={metrics.total}
                                icon={UsersIcon}
                                color="text-blue-600"
                                tooltipText={`Total number of users: ${metrics.total}`}
                                gradient={true}
                                iconOnly={false}
                            />
                            <MetricItem
                                label="Online"
                                value={metrics.online}
                                icon={Wifi}
                                color="text-blue-600"
                                onClick={() => handleQuickFilter('online')}
                                showDot={true}
                                tooltipText={`Online sessions: ${metrics.online} (${metrics.total ? Math.round((metrics.online / metrics.total) * 100) : 0}%)`}
                                gradient={true}
                                iconOnly={false}
                            />
                            <MetricItem
                                label="Suspended"
                                value={metrics.suspended}
                                icon={UserX}
                                color="text-red-600"
                                onClick={() => handleQuickFilter('suspended')}
                                tooltipText={`Suspended users: ${metrics.suspended} (${metrics.total ? Math.round((metrics.suspended / metrics.total) * 100) : 0}%)`}
                                showDot={metrics.suspended > 0}
                                gradient={true}
                                iconOnly={false}
                            />
                        </div>
                    </div>

                    
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
                <BulkActions
                    selectedUsers={selectedUsers}
                    onBulkAction={handleBulkAction}
                    onSelectAll={handleSelectAll}
                    allUsers={filteredUsers}
                    profiles={profilesQuery.data?.data ?? []}
                />
            )}

            {/* Content based on view mode */}
            {viewMode === 'analytics' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Usage Distribution */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                    <PieChart className="h-5 w-5 text-white" />
                                </div>
                                Profile Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <UsageChart users={filteredUsers} />
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-blue-50/30" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600">
                                    <Activity className="h-5 w-5 text-white" />
                                </div>
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <AuditActivityTimeline enabled={Boolean(canSeeAudit)} />
                        </CardContent>
                    </Card>

                    {/* System Health */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-red-50/30" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="flex items-center gap-3 text-gray-800">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700">Online Rate</span>
                                    <span className="text-blue-600 font-bold">
                                        {metrics.total ? Math.round((metrics.online / metrics.total) * 100) : 0}%
                                    </span>
                                </div>
                                <Progress 
                                    value={metrics.total ? (metrics.online / metrics.total) * 100 : 0} 
                                    className="h-3 bg-gray-200"
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700">Active Rate</span>
                                    <span className="text-emerald-600 font-bold">
                                        {metrics.total ? Math.round((metrics.active / metrics.total) * 100) : 0}%
                                    </span>
                                </div>
                                <Progress 
                                    value={metrics.total ? (metrics.active / metrics.total) * 100 : 0} 
                                    className="h-3 bg-gray-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700">Quota Issues</span>
                                    <span className="text-orange-600 font-bold">
                                        {metrics.total ? Math.round((metrics.quotaExceeded / metrics.total) * 100) : 0}%
                                    </span>
                                </div>
                                <Progress 
                                    value={metrics.total ? (metrics.quotaExceeded / metrics.total) * 100 : 0} 
                                    className="h-3 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-500"
                                />
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
                />
            )}

            {/* Add/Edit User Modal */}
            {(isAddUserModalOpen || editingUser) && (
                <AddUserModal
                    isOpen={isAddUserModalOpen || !!editingUser}
                    onClose={handleCloseModal}
                    onUserAdded={handleUserAdded}
                    editingUser={editingUser}
                />
            )}

            {/* CSV Import dialog */}
            <Dialog open={isImportOpen} onOpenChange={(open) => (isImporting ? null : setIsImportOpen(open))}>
                <DialogContent className="sm:max-w-[920px]">
                    <DialogHeader>
                        <DialogTitle>Import Users (CSV)</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            Required columns: <span className="font-mono">username,password,profileId</span>. Optional:{" "}
                            <span className="font-mono">accountStatus,fullName,phoneNumber,email,address</span>.
                        </div>

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
                                    <TableHeader className="sticky top-0 bg-white">
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
                                            <TableRow key={idx} className={r.errors.length ? "bg-red-50/40" : ""}>
                                                <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.raw.username}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.raw.profileId}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.raw.accountStatus || "active"}</TableCell>
                                                <TableCell className="text-sm">
                                                    {r.errors.length ? r.errors.join("; ") : <span className="text-green-700">OK</span>}
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
                        <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isImporting}>
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
        </div>
        </QueryState>
        </>
    );
};

export default UsersPage;