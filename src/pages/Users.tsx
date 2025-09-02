import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Filter,
    PieChart,
    Activity,
    Shield,
    TrendingUp,
    TrendingDown,
    Trash2
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import SearchBar from '@/components/SearchBar';
import UsersTable from '@/components/UsersTable';
import AddUserModal from '../components/AddUserModal';
import useUsers from '../hooks/useUsers';
import { User } from '../types/api';
// Loader import removed as unused
import { useToast } from "@/components/ui/use-toast";
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
                        relative ${iconOnly ? 'p-2' : 'p-3'} rounded-xl border transition-all duration-300
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
                                    <span className={`text-xl font-bold ${color} transition-colors duration-300`}>
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

const ActivityTimeline = ({ users }: { users: User[] }) => {
    const recentActivity = useMemo(() => {
        // Simulate recent activity based on user status
        return users.slice(0, 5).map((user, index) => ({
            id: index,
            user: user.username,
            action: user.isOnline ? 'Logged in' : 'Logged out',
            time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleTimeString(),
            status: user.isOnline ? 'online' : 'offline'
        }));
    }, [users]);

    return (
        <div className="space-y-3">
            {recentActivity.map((activity, index) => (
                <div 
                    key={activity.id} 
                    className="group relative p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-blue-200/50"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${activity.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'} animate-pulse`} />
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${activity.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'} animate-ping opacity-75`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 truncate">
                                {activity.user}
                            </p>
                            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                                {activity.action}
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300 font-mono">
                            {activity.time}
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
    allUsers 
}: { 
    selectedUsers: Set<number>;
    onBulkAction: (action: string) => void;
    onSelectAll: (selected: boolean) => void;
    allUsers: User[];
}) => {
    const isAllSelected = selectedUsers.size === allUsers.length;

    return (
        <div className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 p-4 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-pink-100/20 animate-pulse" />
            <div className="relative z-10 flex items-center gap-4">
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
                    <div className="flex gap-2 ml-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('suspend')}
                            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all duration-300 hover:scale-105"
                        >
                            <UserX className="h-4 w-4 mr-1" />
                            Suspend
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkAction('activate')}
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
                            onClick={() => onBulkAction('delete')}
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
    const { toast } = useToast();

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

    // Enhanced filtering with advanced filters
    const filteredUsers = React.useMemo(() => {
        const users = data?.data?.users ?? [];
        let filtered = users;

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
    }, [data?.data?.users, statusFilter, advancedFilters]);

    // Enhanced metrics with trends
    const metrics = useMemo(() => {
        const allUsers = data?.data?.users ?? [];
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
    }, [filteredUsers, data?.data?.users]);

    const handleSearch = useCallback((term: string) => {
        setSearchQuery(term);
        setCurrentPage(1);
    }, [setSearchQuery, setCurrentPage]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        refetch().finally(() => {
            setTimeout(() => {
                setIsRefreshing(false);
                toast({
                    title: "Users refreshed",
                    description: "The users list has been updated.",
                });
            }, 1000);
        });
    }, [refetch, toast]);

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
            case 'active':
                setStatusFilter('active');
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

    const confirmAndExecute = useCallback((message: string, action: () => void, successMessage: string) => {
        if (window.confirm(message)) {
            action();
            alert(successMessage);
            refetch();
        }
    }, [refetch]);

    const handleAction = useCallback((action: string, user: User) => {
        const actions = {
            edit: () => {
                setEditingUser(user);
                setIsAddUserModalOpen(true);
            },
            delete: () => confirmAndExecute(
                `Are you sure you want to delete user ${user.username}?`,
                () => deleteUserMutation.mutate(user.username),
                'User deleted successfully'
            ),
            'reset-mac': () => confirmAndExecute(
                `Are you sure you want to reset MAC address for user ${user.username}?`,
                () => resetMacAddressMutation.mutate(user.username),
                'MAC address reset successfully'
            ),
            'reset-quota': () => {
                // Implement reset quota logic here
                console.log('Reset quota for user:', user.username);
                alert('Quota reset functionality not implemented yet');
            }
        };

        const actionFunction = actions[action as keyof typeof actions];
        if (actionFunction) {
            actionFunction();
        } else {
            console.warn('Unknown action:', action);
        }
    }, [deleteUserMutation, resetMacAddressMutation, confirmAndExecute]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing page size
    }, [setCurrentPage]);

    const handleExportUsers = useCallback(() => {
        // Exclude suspended users from export
        const exportableUsers = filteredUsers.filter(u => u.accountStatus !== 'suspended');
        if (exportableUsers.length > 0) {
            // Prepare data for export with only the required fields
            const exportData = exportableUsers.map(user => ({
                Name: user.userDetails.fullName || 'N/A',
                Phone: user.userDetails.phoneNumber || 'N/A',
                Username: user.username || 'N/A'
            }));

            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Users");
            
            // Generate filename with current date and filter info
            const date = new Date().toISOString().split('T')[0];
            const filterSuffix = statusFilter ? `_${statusFilter}` : '';
            const filename = `users${filterSuffix}_${date}.xlsx`;
            
            writeFile(wb, filename);
            
            toast({
                title: "Export successful",
                description: `${exportableUsers.length} users exported to ${filename}`,
            });
        } else {
            toast({
                title: "No data to export",
                description: "There are no users to export.",
                variant: "destructive",
            });
        }
    }, [filteredUsers, statusFilter, toast]);

    // New handlers for enhanced features
    const handleSelectAll = useCallback((selected: boolean) => {
        if (selected) {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
        } else {
            setSelectedUsers(new Set());
        }
    }, [filteredUsers]);

    const handleBulkAction = useCallback((action: string) => {
        const selectedUserList = filteredUsers.filter(u => selectedUsers.has(u.id));
        
        switch (action) {
            case 'suspend':
                if (confirm(`Suspend ${selectedUserList.length} users?`)) {
                    // Implement bulk suspend
                    toast({
                        title: "Bulk action",
                        description: `${selectedUserList.length} users suspended`,
                    });
                }
                break;
            case 'activate':
                if (confirm(`Activate ${selectedUserList.length} users?`)) {
                    // Implement bulk activate
                    toast({
                        title: "Bulk action",
                        description: `${selectedUserList.length} users activated`,
                    });
                }
                break;
            case 'export':
                handleExportUsers();
                break;
            case 'delete':
                if (confirm(`Delete ${selectedUserList.length} users? This action cannot be undone.`)) {
                    // Implement bulk delete
                    toast({
                        title: "Bulk action",
                        description: `${selectedUserList.length} users deleted`,
                    });
                }
                break;
        }
    }, [selectedUsers, filteredUsers, handleExportUsers, toast]);

    if (isLoading) {
        return (
            <div className="w-full py-6 space-y-6">
                <header className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </header>

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
        );
    }

    if (error) return <div className="text-red-500 text-center">Error: {error.message}</div>;

    return (
        <div className="w-full py-6 space-y-6 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/30 min-h-screen">
            <PageHeader 
                title="Users Management"
                subtitle="Comprehensive user management and monitoring system"
                icon={UsersIcon}
                rightContent={(
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3">
                            <Label className="text-sm font-medium text-blue-100">View:</Label>
                            <Select value={viewMode} onValueChange={(value: 'table' | 'cards' | 'analytics') => setViewMode(value)}>
                                <SelectTrigger className="w-[140px] bg-white/20 border-white/30 text-white backdrop-blur-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="table">Table</SelectItem>
                                    <SelectItem value="cards">Cards</SelectItem>
                                    <SelectItem value="analytics">Analytics</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="hidden lg:flex flex-wrap gap-2">
                            <Badge variant={!statusFilter ? "secondary" : "outline"} className="cursor-pointer hover:bg-white/20 border-white/30 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105" onClick={() => handleQuickFilter('all')}>All Users</Badge>
                            <Badge variant={statusFilter === 'active' ? "secondary" : "outline"} className="cursor-pointer hover:bg-emerald-500/20 border-emerald-300/50 text-emerald-100 backdrop-blur-sm transition-all duration-300 hover:scale-105" onClick={() => handleQuickFilter('active')}>Active</Badge>
                            <Badge variant={statusFilter === 'suspended' ? "secondary" : "outline"} className="cursor-pointer hover:bg-red-500/20 border-red-300/50 text-red-100 backdrop-blur-sm transition-all duration-300 hover:scale-105" onClick={() => handleQuickFilter('suspended')}>Suspended</Badge>
                            <Badge variant={statusFilter === 'online' ? "secondary" : "outline"} className="cursor-pointer hover:bg-blue-500/20 border-blue-300/50 text-blue-100 backdrop-blur-sm transition-all duration-300 hover:scale-105" onClick={() => handleQuickFilter('online')}>Online</Badge>
                            <Badge variant={statusFilter === 'offline' ? "secondary" : "outline"} className="cursor-pointer hover:bg-gray-500/20 border-gray-300/50 text-gray-100 backdrop-blur-sm transition-all duration-300 hover:scale-105" onClick={() => handleQuickFilter('offline')}>Offline</Badge>
                        </div>
                    </div>
                )}
                actions={(
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button variant="outline" onClick={handleExportUsers} disabled={filteredUsers.length === 0} className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={handleAddUser} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                            <Plus className="h-4 w-4 mr-2" />
                            New User
                        </Button>
                    </div>
                )}
            />

            {/* Enhanced Dashboard Controls Card */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-pink-50/30" />
                <CardContent className="relative z-10 p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Search + Inline Filters */}
                        <div className="flex-1 min-w-0 lg:max-w-5xl flex flex-col md:flex-row gap-3 items-start md:items-center">
                            <div className="w-full md:min-w-[60%] md:max-w-[60%]">
                                <SearchBar 
                                    currentSearchTerm={searchQuery} 
                                    onSearch={handleSearch}
                                    placeholder="Search by username, status, or profile..."
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Filter className="h-4 w-4 text-gray-500" />
                                <Select 
                                    value={advancedFilters.profile} 
                                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, profile: value }))}
                                >
                                    <SelectTrigger className="w-[140px] bg-white/80 border-gray-200/60">
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

                        {/* Compact Metrics Section */}
                        <div className="flex items-center gap-4 lg:border-l lg:border-gray-200/60 lg:pl-4">
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
                                tooltipText={`Online users: ${metrics.online} (${metrics.total ? Math.round((metrics.online / metrics.total) * 100) : 0}%)`}
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
                            <ActivityTimeline users={filteredUsers} />
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
                    totalPages={data?.data?.totalPages ?? 0}
                    totalUsers={data?.data?.totalUsers ?? 0}
                    onPageChange={setCurrentPage}
                    onAction={handleAction}
                    isLoading={isLoading}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    deleteUserMutation={deleteUserMutation}
                    resetMacAddressMutation={resetMacAddressMutation}
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
        </div>
    );
};

export default UsersPage;