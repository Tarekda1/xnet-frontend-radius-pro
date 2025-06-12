import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, RefreshCw, Users as UsersIcon, ChevronDown, ChevronUp, Wifi, WifiOff, UserCheck, UserX, Edit, Star, User as UserIcon } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import UsersTable from '@/components/UsersTable';
import AddUserModal from '../components/AddUserModal';
import useUsers from '../hooks/useUsers';
import { User } from '../types/api';
import Loader from '@/components/ui/loader';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const MetricItem = ({ 
    label, 
    value, 
    icon: Icon, 
    color, 
    onClick, 
    showDot = false,
    tooltipText 
}: { 
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    onClick?: () => void;
    showDot?: boolean;
    tooltipText: string;
}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div 
                    className={`flex flex-col items-center ${onClick ? 'cursor-pointer hover:bg-accent/50 rounded-lg px-2 py-1 transition-colors' : ''}`}
                    onClick={onClick}
                >
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <Icon className={`h-4 w-4 ${color}`} />
                            {showDot && (
                                <span className={`absolute -top-1 -right-1 h-2 w-2 ${color.replace('text', 'bg')} rounded-full`} />
                            )}
                        </div>
                        <span className={`text-lg font-semibold ${color}`}>{value}</span>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const UsersPage: React.FC = () => {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
    const [pageSize, setPageSize] = useState(50);
    const [isRefreshing, setIsRefreshing] = useState(false);
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
            case 'active':
                setSearchQuery('status:active');
                break;
            case 'suspended':
                setSearchQuery('status:suspended');
                break;
            case 'online':
                setSearchQuery('status:online');
                break;
            case 'offline':
                setSearchQuery('status:offline');
                break;
            default:
                setSearchQuery('');
        }
        setCurrentPage(1);
    }, [setSearchQuery, setCurrentPage]);

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

    // Calculate metrics
    const users = data?.data?.users ?? [];
    const metrics = {
        total: users.length,
        active: users.filter(u => u.accountStatus === 'active').length,
        suspended: users.filter(u => u.accountStatus === 'suspended').length,
        online: users.filter(u => u.isOnline).length,
        offline: users.filter(u => !u.isOnline).length,
    };

    return (
        <div className="w-full py-4 space-y-6">
            {/* Enhanced Header with Breadcrumbs */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <UsersIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Users</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage and monitor user accounts
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                        {/* Quick Action Filters */}
                        <div className="flex flex-wrap gap-2">
                            <Badge 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleQuickFilter('all')}
                            >
                                All Users
                            </Badge>
                            <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleQuickFilter('active')}
                            >
                                Active
                            </Badge>
                            <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleQuickFilter('suspended')}
                            >
                                Suspended
                            </Badge>
                            <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleQuickFilter('online')}
                            >
                                Online
                            </Badge>
                            <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleQuickFilter('offline')}
                            >
                                Offline
                            </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <Button onClick={handleAddUser}>
                                <Plus className="h-4 w-4 mr-2" />
                                New User
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Controls Card */}
            <Card className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search Section */}
                    <div className="flex-1 min-w-0 lg:max-w-xl">
                        <SearchBar 
                            currentSearchTerm={searchQuery} 
                            onSearch={handleSearch}
                            placeholder="Search by username, status, or profile..."
                            className="w-full"
                        />
                    </div>

                    {/* Metrics Section */}
                    <div className="flex items-center gap-4 lg:border-l lg:border-border lg:pl-4">
                        {/* User Status Stats */}
                        <div className="flex items-center gap-3">
                            <MetricItem
                                label="Total"
                                value={metrics.total}
                                icon={UsersIcon}
                                color="text-primary"
                                tooltipText={`Total number of users: ${metrics.total}`}
                            />
                            <MetricItem
                                label="Active"
                                value={metrics.active}
                                icon={UserCheck}
                                color="text-green-600"
                                onClick={() => handleQuickFilter('active')}
                                tooltipText={`Active users: ${metrics.active} (${metrics.total ? Math.round((metrics.active / metrics.total) * 100) : 0}%)`}
                            />
                        </div>

                        {/* Connection Stats */}
                        <div className="flex items-center gap-3">
                            <MetricItem
                                label="Online"
                                value={metrics.online}
                                icon={Wifi}
                                color="text-blue-600"
                                onClick={() => handleQuickFilter('online')}
                                showDot={true}
                                tooltipText={`Online users: ${metrics.online} (${metrics.total ? Math.round((metrics.online / metrics.total) * 100) : 0}%)`}
                            />
                            <MetricItem
                                label="Offline"
                                value={metrics.offline}
                                icon={WifiOff}
                                color="text-gray-600"
                                onClick={() => handleQuickFilter('offline')}
                                tooltipText={`Offline users: ${metrics.offline} (${metrics.total ? Math.round((metrics.offline / metrics.total) * 100) : 0}%)`}
                            />
                        </div>

                        {/* Additional Stats */}
                        <div className="flex items-center gap-3">
                            <MetricItem
                                label="Suspended"
                                value={metrics.suspended}
                                icon={UserX}
                                color="text-red-600"
                                onClick={() => handleQuickFilter('suspended')}
                                tooltipText={`Suspended users: ${metrics.suspended} (${metrics.total ? Math.round((metrics.suspended / metrics.total) * 100) : 0}%)`}
                                showDot={metrics.suspended > 0}
                            />
                            {editingUser && (
                                <MetricItem
                                    label="Editing"
                                    value={1}
                                    icon={Edit}
                                    color="text-blue-600"
                                    tooltipText={`Currently editing: ${editingUser.username}`}
                                    showDot={true}
                                />
                            )}
                        </div>

                        {/* Profile Distribution */}
                        <div className="flex items-center gap-3">
                            <MetricItem
                                label="Premium"
                                value={users.filter(u => u.profile.profileName.toLowerCase() === 'premium').length}
                                icon={Star}
                                color="text-yellow-600"
                                onClick={() => handleQuickFilter('profile:premium')}
                                tooltipText="Click to filter premium users"
                            />
                            <MetricItem
                                label="Basic"
                                value={users.filter(u => u.profile.profileName.toLowerCase() === 'basic').length}
                                icon={UserIcon}
                                color="text-blue-600"
                                onClick={() => handleQuickFilter('profile:basic')}
                                tooltipText="Click to filter basic users"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Users Table */}
            <UsersTable
                users={users}
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